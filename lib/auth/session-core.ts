import { createHmac, timingSafeEqual } from "node:crypto"

import type { AuthUser } from "@/types/auth"

/**
 * Signed session cookie primitives.
 *
 * This module is safe to import from the Proxy (Node.js runtime) and from
 * server components. It intentionally avoids `next/headers`; use
 * `@/lib/auth/session` for reading/writing the cookie inside the app.
 */

export const SESSION_COOKIE_NAME = "kiyu_session"

/** Must match the Laravel Sanctum token expiration (8 hours). */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8

const SESSION_MAX_BYTES = 4096

const AUTH_SECRET = process.env.AUTH_SECRET ?? ""

if (AUTH_SECRET.length === 0) {
  throw new Error("AUTH_SECRET is not configured.")
}

export type Session = {
  token: string
  user: AuthUser
}

function sign(payload: string): string {
  return createHmac("sha256", AUTH_SECRET).update(payload).digest("base64url")
}

function verify(payload: string, signature: string): boolean {
  const expected = Buffer.from(sign(payload), "base64url")
  const actual = Buffer.from(signature, "base64url")

  if (expected.length !== actual.length) {
    return false
  }

  return timingSafeEqual(expected, actual)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/**
 * Encodes and signs a session. Throws when the cookie would exceed the safe
 * browser cookie size limit.
 */
export function serializeSession(session: Session): string {
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString(
    "base64url"
  )

  const encoded = `${payload}.${sign(payload)}`

  if (Buffer.byteLength(encoded, "utf8") > SESSION_MAX_BYTES) {
    throw new Error(
      `Session cookie is too large (max ${SESSION_MAX_BYTES} bytes).`
    )
  }

  return encoded
}

/**
 * Verifies and parses a signed session cookie value. Returns `null` for any
 * malformed or tampered value.
 */
export function parseSession(value: string | null | undefined): Session | null {
  if (!value) {
    return null
  }

  const [payload, signature] = value.split(".")

  if (!payload || !signature || !verify(payload, signature)) {
    return null
  }

  try {
    const data: unknown = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    )

    if (!isRecord(data) || typeof data.token !== "string" || !data.token) {
      return null
    }

    if (!isRecord(data.user) || typeof data.user.role !== "string") {
      return null
    }

    if (typeof data.user.id !== "number" && typeof data.user.id !== "string") {
      return null
    }

    return {
      token: data.token,
      user: data.user as AuthUser,
    }
  } catch {
    return null
  }
}

/**
 * Reads a session from a raw `Cookie` header value.
 */
export function readSessionFromCookieHeader(
  cookieHeader: string | null | undefined
): Session | null {
  if (!cookieHeader) {
    return null
  }

  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim()
    const separator = trimmed.indexOf("=")

    if (separator === -1) {
      continue
    }

    const name = trimmed.slice(0, separator)

    if (name !== SESSION_COOKIE_NAME) {
      continue
    }

    const rawValue = trimmed.slice(separator + 1)

    try {
      return parseSession(decodeURIComponent(rawValue))
    } catch {
      return null
    }
  }

  return null
}

/**
 * Reads a session from a Web `Request` (route handlers) or a Next.js
 * `NextRequest` (Proxy). No `next/headers` dependency so it can run in both.
 */
export function readSessionFromRequest(request: Request): Session | null {
  const nextRequest = request as Request & {
    cookies?: { get(name: string): { value: string } | undefined }
  }

  const cookie = nextRequest.cookies?.get?.(SESSION_COOKIE_NAME)?.value

  if (cookie) {
    return parseSession(cookie)
  }

  return readSessionFromCookieHeader(request.headers.get("cookie"))
}
