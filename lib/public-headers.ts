/**
 * Headers for the public, unauthenticated API surfaces (kiosk, display,
 * online booking).
 *
 * The API resolves the tenant from a device credential when one is present;
 * otherwise from `X-Tenant-Slug`. Credentials are per-device and come from
 * `localStorage` (see `lib/kiosk/device` and `lib/display/device`), never from
 * the build. The slug is only a fallback for surfaces that are not a registered
 * device.
 */

import { displayCredential } from "@/lib/display/device"
import { kioskCredential } from "@/lib/kiosk/device"

export const PUBLIC_TENANT_SLUG = process.env.NEXT_PUBLIC_TENANT_SLUG ?? ""

/**
 * The tenant's single active facility (V1 is single-facility). Used to join
 * the public Reverb channel that carries queue refresh signals.
 */
export const PUBLIC_FACILITY_ID = Number(
  process.env.NEXT_PUBLIC_FACILITY_ID ?? "0"
)

export function publicHeaders(
  extra: Record<string, string> = {}
): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...extra,
  }

  if (PUBLIC_TENANT_SLUG) {
    headers["X-Tenant-Slug"] = PUBLIC_TENANT_SLUG
  }

  return headers
}

/**
 * Headers for a registered kiosk device. Sends the device credential when this
 * browser has been paired; the API prefers it over the tenant slug.
 */
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

/**
 * Headers for a registered display screen. Sends `X-Display-Token` when this
 * browser has been paired as a display; the API prefers it over the slug.
 *
 * A display must never send `X-Kiosk-Token`: the two device types have separate
 * credentials and separate plan quotas.
 */
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
