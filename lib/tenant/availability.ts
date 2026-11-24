import "server-only"

/**
 * Hostname→tenant availability cache used by the proxy.
 *
 * The proxy runs on the Node.js runtime and is the only place a 404 status can
 * be returned before rendering starts (Next.js streams documents, which fixes
 * the status at 200). The check is a small public read, cached per slug for a
 * short TTL so ordinary navigation does not hit the API each time (PRD §7.9).
 */

const POSITIVE_TTL_MS = 60_000
const NEGATIVE_TTL_MS = 15_000

type Entry = { available: boolean; status: number | null; expiresAt: number }

const cache = new Map<string, Entry>()

const API_BASE_URL = process.env.API_BASE_URL ?? ""

export type TenantAvailability = {
  /** 200 active tenant, 403 suspended/inactive, 404 unknown slug. */
  available: boolean
  status: number | null
}

/** Resolve a tenant slug's public availability, cached briefly per slug. */
export async function resolveTenantAvailability(
  slug: string
): Promise<TenantAvailability> {
  const now = Date.now()
  const hit = cache.get(slug)

  if (hit !== undefined && hit.expiresAt > now) {
    return { available: hit.available, status: hit.status }
  }

  let available = false
  let status: number | null = null

  try {
    const response = await fetch(
      `${API_BASE_URL.replace(/\/$/, "")}/public/tenant/${encodeURIComponent(slug)}`,
      { headers: { Accept: "application/json" }, cache: "no-store" }
    )

    status = response.status
    available = response.status === 200
  } catch {
    // Treat an unreachable API as "unknown": do not hard-404 a real tenant on a
    // transient outage. The page-level guard still enforces authorization.
    return { available: false, status: null }
  }

  cache.set(slug, {
    available,
    status,
    expiresAt: now + (available ? POSITIVE_TTL_MS : NEGATIVE_TTL_MS),
  })

  return { available, status }
}
