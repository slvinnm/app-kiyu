import type { NextRequest } from "next/server"

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])

const APP_ORIGIN = process.env.APP_ORIGIN ?? ""

/**
 * Rejects cross-site state-changing requests.
 *
 * Browsers cannot forge `Origin`, so comparing it to a trusted host is a sound
 * CSRF check — but only if the trusted host is not itself attacker-controlled.
 * `X-Forwarded-Host` is a client-supplied header, so it is never trusted; the
 * configured `APP_ORIGIN` wins, and only when it is unset do we fall back to
 * `Host`. A missing `Origin` on a state-changing request is rejected: same-origin
 * `fetch` always sends one, and non-browser clients have no business calling
 * these handlers (they would otherwise bypass the check entirely).
 */
export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin")

  if (!origin) {
    return !STATE_CHANGING_METHODS.has(request.method.toUpperCase())
  }

  let originHost: string

  try {
    originHost = new URL(origin).host
  } catch {
    return false
  }

  const trustedHost = APP_ORIGIN
    ? new URL(APP_ORIGIN).host
    : (request.headers.get("host") ?? request.nextUrl.host)

  return originHost === trustedHost
}

export function isStateChangingMethod(request: NextRequest): boolean {
  return STATE_CHANGING_METHODS.has(request.method.toUpperCase())
}
