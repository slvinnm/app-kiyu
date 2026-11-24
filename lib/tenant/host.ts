/**
 * Hostname classification — the single source of truth for "which application
 * is this request for?" (PRD §3.3, §3.4).
 *
 * The hostname selects a *context*, never an authorization. A tenant label
 * proves nothing about membership; the API does. Pure on purpose: the proxy
 * (Node runtime) and server components both import this, so it must not touch
 * `next/headers` or the network.
 */

/**
 * Labels that are application infrastructure, never a tenant slug (PRD §3.3).
 * Centralised here; route conditions elsewhere must consult this, not repeat it.
 */
export const RESERVED_LABELS = new Set([
  "kiyu",
  "app",
  "api",
  "www",
  "admin",
  "support",
  "docs",
  "status",
  "static",
  "assets",
  "localhost",
])

/**
 * Root domain the deployment serves. `kiyu.test` locally, `kiyu.id` in
 * production. Set `ROOT_DOMAIN` per environment; the fallback is the local one.
 *
 * Read at module load so the pure classifier stays deterministic in tests.
 */
export const ROOT_DOMAIN = (process.env.ROOT_DOMAIN ?? "kiyu.test")
  .toLowerCase()
  .replace(/^\./, "")

export type HostContext =
  /** The bare root host: marketing site (`kiyu.test`). */
  | { kind: "marketing" }
  /** `app.<root>`: SaaS portal, platform_admin and tenant_admin. */
  | { kind: "portal" }
  /** `api.<root>`: the Laravel API; the frontend never serves it. */
  | { kind: "api" }
  /** `{slug}.<root>`: a tenant workspace. */
  | { kind: "tenant"; slug: string }
  /** A local/dev host or a foreign host: no application context. */
  | { kind: "unknown" }

/** Lower-cased hostname with the port stripped. */
function hostnameOf(host: string | null | undefined): string {
  return host?.split(":")[0]?.toLowerCase() ?? ""
}

/** Classify a request hostname into an application context. */
export function classifyHost(host: string | null | undefined): HostContext {
  const hostname = hostnameOf(host)

  if (hostname === "") {
    return { kind: "unknown" }
  }

  if (hostname === ROOT_DOMAIN) {
    return { kind: "marketing" }
  }

  // The host must be exactly `<one-label>.<root>`; anything else (nested
  // subdomains, foreign domains, look-alikes) is not an application host.
  const suffix = `.${ROOT_DOMAIN}`

  if (!hostname.endsWith(suffix)) {
    return { kind: "unknown" }
  }

  const label = hostname.slice(0, -suffix.length)

  if (label === "") {
    return { kind: "marketing" }
  }

  // A tenant lives on exactly one label.
  if (label.includes(".")) {
    return { kind: "unknown" }
  }

  if (label === "app") {
    return { kind: "portal" }
  }

  if (label === "api") {
    return { kind: "api" }
  }

  if (RESERVED_LABELS.has(label)) {
    return { kind: "unknown" }
  }

  // Slugs are DNS-safe by construction; anything else is not a tenant.
  if (!/^[a-z0-9-]+$/.test(label)) {
    return { kind: "unknown" }
  }

  return { kind: "tenant", slug: label }
}

/** Tenant slug carried by the host, or `null` for any non-tenant host. */
export function tenantSlugFromHost(host: string | null | undefined): string | null {
  const context = classifyHost(host)

  return context.kind === "tenant" ? context.slug : null
}

/** True when the host is the bare marketing site. */
export function isMarketingHost(host: string | null | undefined): boolean {
  return classifyHost(host).kind === "marketing"
}

/** True when the host is the SaaS portal. */
export function isPortalHost(host: string | null | undefined): boolean {
  return classifyHost(host).kind === "portal"
}

/**
 * The public hostname of a request, preferring the proxy's `X-Forwarded-Host`.
 *
 * Only ever used as a hostname (a context selector), never as authorization.
 * Behind nginx the forwarded value is authoritative; without a proxy the `Host`
 * header is already correct.
 */
export function requestHostname(headers: Headers): string | null {
  return headers.get("x-forwarded-host") ?? headers.get("host") ?? null
}
