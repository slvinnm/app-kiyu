/**
 * Headers for the public, unauthenticated API surfaces (kiosk, display,
 * online booking). The API resolves the tenant from `X-Tenant-Slug`; kiosk
 * intake additionally needs the device credential in `X-Kiosk-Token`.
 *
 * Both values are configuration, not user input: the slug identifies the
 * clinic this deployment serves, and the token is provisioned when the kiosk
 * device is registered.
 */

export const PUBLIC_TENANT_SLUG = process.env.NEXT_PUBLIC_TENANT_SLUG ?? ""

export const PUBLIC_KIOSK_TOKEN = process.env.NEXT_PUBLIC_KIOSK_TOKEN ?? ""

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

export function kioskHeaders(
  extra: Record<string, string> = {}
): Record<string, string> {
  const headers = publicHeaders(extra)

  if (PUBLIC_KIOSK_TOKEN) {
    headers["X-Kiosk-Token"] = PUBLIC_KIOSK_TOKEN
  }

  return headers
}
