import "server-only"

import { cookies } from "next/headers"

import type { AuthUser } from "@/types/auth"

import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  parseSession,
  readSessionFromCookieHeader,
  readSessionFromRequest,
  serializeSession,
} from "@/lib/auth/session-core"

import type { Session } from "@/lib/auth/session-core"

export {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  parseSession,
  readSessionFromCookieHeader,
  readSessionFromRequest,
}

export type { Session }

const isSecureCookie = process.env.NODE_ENV === "production"

/**
 * Persists the Laravel Sanctum token and user claims in a signed, HttpOnly
 * cookie. The token is never exposed to client-side JavaScript.
 */
export async function createSession(
  token: string,
  user: AuthUser
): Promise<void> {
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE_NAME, serializeSession({ token, user }), {
    httpOnly: true,
    secure: isSecureCookie,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()

  cookieStore.delete(SESSION_COOKIE_NAME)
}

/**
 * Returns the verified session for the current request, or `null`.
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()

  return parseSession(cookieStore.get(SESSION_COOKIE_NAME)?.value)
}
