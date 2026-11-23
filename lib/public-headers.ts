/**
 * Headers for the public, unauthenticated API surfaces (kiosk, display,
 * online booking).
 *
 * The API resolves the tenant and facility from a registered device credential.
 * Credentials are per-device and come from `localStorage` after pairing (see
 * `lib/kiosk/device` and `lib/display/device`); nothing is baked into the build,
 * so one deployment serves every tenant.
 */

import { displayCredential } from "@/lib/display/device"
import { kioskCredential } from "@/lib/kiosk/device"

export function publicHeaders(
  extra: Record<string, string> = {}
): Record<string, string> {
  return {
    Accept: "application/json",
    ...extra,
  }
}

/** Headers for a registered kiosk device. */
export function kioskHeaders(
  extra: Record<string, string> = {}
): Record<string, string> {
  const headers = publicHeaders(extra)
  const credential = kioskCredential()

  if (credential) {
    headers["X-Kiosk-Token"] = credential
  }

  return headers
}

/** Headers for a registered display screen. Never sends the kiosk token. */
export function displayHeaders(
  extra: Record<string, string> = {}
): Record<string, string> {
  const headers = publicHeaders(extra)
  const credential = displayCredential()

  if (credential) {
    headers["X-Display-Token"] = credential
  }

  return headers
}
