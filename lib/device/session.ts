import "server-only"

import { createHmac, timingSafeEqual } from "node:crypto"

import { cookies } from "next/headers"

import type { NextRequest } from "next/server"

/**
 * Device credentials for kiosk and display screens.
 *
 * The raw credential is never handed to browser JavaScript. It lives in a
 * signed, HttpOnly cookie and is only ever read by server-side route handlers
 * that forward it to the API as a device header. That keeps an XSS on the kiosk
 * or display page from exfiltrating a credential that authorises intake.
 *
 * The cookie is rolling: every successful device request re-issues it with a
 * fresh max-age, so a device in daily use never expires. A device whose
 * `expires_at` the admin set still stops working at the API, because the API
 * enforces that date on every request.
 */

export const KIOSK_COOKIE_NAME = "kiyu_kiosk_device"
export const DISPLAY_COOKIE_NAME = "kiyu_display_device"

/** Chrome caps cookie lifetime at 400 days. */
export const DEVICE_COOKIE_MAX_AGE_SECONDS = 400 * 24 * 60 * 60

export type DeviceKind = "kiosk" | "display"

export type DeviceCookiePayload = {
  credential: string
  device: {
    id: number
    name: string
    tenant: { id: number; name: string; slug: string }
    facility: { id: number; name: string; code: string | null }
  }
}

const DEVICE_KINDS: Record<DeviceKind, string> = {
  kiosk: KIOSK_COOKIE_NAME,
  display: DISPLAY_COOKIE_NAME,
}

function cookieName(kind: DeviceKind): string {
  return DEVICE_KINDS[kind]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

/**
 * HMAC over the device payload.
 *
 * The device cookie drives the display's Reverb channel (`public.facility.{id}`)
 * and is otherwise re-validated by the API on every proxied request. Signing it
 * stops a tampered cookie from pointing the display at another facility's public
 * channel. Reuses the session secret — one secret to rotate.
 */
function signPayload(payload: string): string {
  const secret = process.env.AUTH_SECRET ?? ""

  if (secret.length === 0) {
    throw new Error("AUTH_SECRET is not configured.")
  }

  return createHmac("sha256", secret).update(payload).digest("base64url")
}

function serializePayload(payload: DeviceCookiePayload): string {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url"
  )

  return `${encoded}.${signPayload(encoded)}`
}

/** Signed cookie value for a device payload. */
export function serializeDeviceCookie(payload: DeviceCookiePayload): string {
  return serializePayload(payload)
}

function parsePayload(raw: string): DeviceCookiePayload | null {
  const [encoded, signature] = raw.split(".")

  if (!encoded || !signature) {
    return null
  }

  // Constant-time compare; a malformed signature is simply rejected.
  const expected = Buffer.from(signPayload(encoded), "base64url")
  const actual = Buffer.from(signature, "base64url")

  if (
    expected.length !== actual.length ||
    !timingSafeEqual(expected, actual)
  ) {
    return null
  }

  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    )

    if (!isRecord(parsed)) {
      return null
    }

    const device = parsed.device

    if (typeof parsed.credential !== "string" || !isRecord(device)) {
      return null
    }

    const tenant = device.tenant
    const facility = device.facility

    if (
      typeof device.id !== "number" ||
      typeof device.name !== "string" ||
      !isRecord(tenant) ||
      typeof tenant.id !== "number" ||
      typeof tenant.slug !== "string" ||
      !isRecord(facility) ||
      typeof facility.id !== "number"
    ) {
      return null
    }

    return parsed as DeviceCookiePayload
  } catch {
    return null
  }
}

/**
 * Reads the device credential from the incoming request's cookies.
 *
 * Safe to call from a server component or a route handler; it never throws and
 * returns `null` when the device is not paired.
 */
export async function readDeviceCredential(
  kind: DeviceKind
): Promise<DeviceCookiePayload | null> {
  const store = await cookies()
  const raw = store.get(cookieName(kind))?.value

  return raw ? parsePayload(raw) : null
}

/**
 * Reads the device credential from a `NextRequest`. Used by the device proxy
 * route handler, which has the request but not the `cookies()` store.
 */
export function readDeviceCredentialFromRequest(
  request: NextRequest,
  kind: DeviceKind
): DeviceCookiePayload | null {
  const raw = request.cookies.get(cookieName(kind))?.value

  return raw ? parsePayload(raw) : null
}

/**
 * Writes the device credential cookie. Called only after a successful pairing.
 */
export async function writeDeviceCredential(
  kind: DeviceKind,
  payload: DeviceCookiePayload
): Promise<void> {
  const store = await cookies()

  store.set(cookieName(kind), serializePayload(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: DEVICE_COOKIE_MAX_AGE_SECONDS,
  })
}

/** Removes the device credential cookie (unpair, or a revoked credential). */
export async function clearDeviceCredential(kind: DeviceKind): Promise<void> {
  const store = await cookies()

  store.delete(cookieName(kind))
}

/**
 * The API endpoint that proves a device credential is still usable. Both are
 * throttled reads that require a valid device credential and return 403 once
 * the device is revoked or its `expires_at` has passed.
 */
const VERIFY_PATH: Record<DeviceKind, string> = {
  kiosk: "departments/active",
  display: "public/queue",
}

const VERIFY_HEADER: Record<DeviceKind, string> = {
  kiosk: "X-Kiosk-Token",
  display: "X-Display-Token",
}

/**
 * Reads the device credential and confirms the API still accepts it.
 *
 * A cookie only proves the browser was paired once; the admin may have revoked
 * the device or its `expires_at` may have passed since. Pages call this before
 * rendering a device UI so an expired device lands on onboarding immediately
 * instead of flashing the kiosk, failing its first request, and reloading.
 *
 * Returns the credential payload when usable, `null` otherwise.
 */
export async function readUsableDeviceCredential(
  kind: DeviceKind
): Promise<DeviceCookiePayload | null> {
  const device = await readDeviceCredential(kind)

  if (!device) {
    return null
  }

  const baseUrl = process.env.API_BASE_URL

  if (!baseUrl) {
    throw new Error("API_BASE_URL is not configured.")
  }

  try {
    const response = await fetch(
      `${baseUrl.replace(/\/$/, "")}/${VERIFY_PATH[kind]}`,
      {
        headers: {
          Accept: "application/json",
          [VERIFY_HEADER[kind]]: device.credential,
        },
        cache: "no-store",
      }
    )

    return response.ok ? device : null
  } catch {
    // Network failure is not proof of revocation: keep the device so a
    // transient outage does not force a re-pair on every kiosk.
    return device
  }
}

/** Cookie attributes for re-issuing a rolling credential on a response. */
export function deviceCookieOptions(): {
  httpOnly: true
  secure: boolean
  sameSite: "strict"
  path: string
  maxAge: number
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: DEVICE_COOKIE_MAX_AGE_SECONDS,
  }
}

export { cookieName as deviceCookieName }
