/**
 * Hostnames that are application context, never a tenant.
 *
 * `kiyu.test` is the marketing site, `app.kiyu.test` the SaaS portal, and
 * `api.kiyu.test` the Laravel API. A tenant is any other single label.
 */
const RESERVED_LABELS = new Set(["kiyu", "app", "api", "www", "localhost"])

/** The bare marketing host, `kiyu.test` (any port). */
const MARKETING_HOST = "kiyu.test"

/**
 * Normalised hostname: lower-case, port stripped. Hosts are case-insensitive.
 */
function hostnameOf(host: string | null | undefined): string {
  return host?.split(":")[0]?.toLowerCase() ?? ""
}

/**
 * The tenant slug carried by a hostname, or `null` when the host is an
 * application host rather than a tenant subdomain.
 *
 * `x-forwarded-host` is set by the local nginx vhost and carries the public
 * hostname; behind no proxy it is absent and `host` is already correct. The
 * forwarded value is only used as a hostname, never as authorization — the API
 * still proves membership.
 *
 * Pure on purpose: the proxy (edge runtime) imports this and cannot use
 * `next/headers`.
 */
export function tenantSlugFromHost(host: string | null | undefined): string | null {
  const hostname = hostnameOf(host)
  const labels = hostname.split(".")

  // A tenant lives on exactly one label: `acme.kiyu.test`.
  if (labels.length !== 3 || labels[1] !== "kiyu" || labels[2] !== "test") {
    return null
  }

  const label = labels[0] ?? ""

  if (label === "" || RESERVED_LABELS.has(label)) {
    return null
  }

  // Slugs are DNS-safe by construction; anything else is not a tenant.
  return /^[a-z0-9-]+$/.test(label) ? label : null
}

/** True when the host is the bare marketing site (`kiyu.test`, not a tenant). */
export function isMarketingHost(host: string | null | undefined): boolean {
  return hostnameOf(host) === MARKETING_HOST
}

/**
 * Tenant slug for a request, given its headers.
 *
 * `NEXT_PUBLIC_TENANT_SLUG` remains the fallback for setups that reach the app
 * on a non-tenant host (`localhost:3000`); on any real host it is ignored, so
 * one running server serves every tenant.
 */
export function resolveTenantSlug(
  host: string | null | undefined
): string | null {
  const fromHost = tenantSlugFromHost(host)

  if (fromHost !== null) {
    return fromHost
  }

  const fallback = process.env.NEXT_PUBLIC_TENANT_SLUG ?? ""

  return fallback !== "" ? fallback : null
}
