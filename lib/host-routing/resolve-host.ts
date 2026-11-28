import { env } from "@/config/environment"

export type AppContext =
  "public" | "app" | "tenant" | "customer" | "portal" | "devices"

export interface TenantPublicInfo {
  id: number
  name: string
  slug: string
  status: string
  timezone: string
  allow_public_registration: boolean
}

export interface HostMatch {
  context: AppContext
  tenantSlug?: string
  internalBasePath: string
}

/**
 * Strip port from host header (e.g. "app.kiyu.test:3000" -> "app.kiyu.test")
 */
export function normalizeHostname(hostHeader: string | null): string {
  if (!hostHeader) return ""
  return hostHeader.split(",")[0].trim().split(":")[0].toLowerCase()
}

/**
 * Resolve host + pathname to application context and internal route base path
 */
export function resolveHost(
  hostHeader: string | null,
  pathname: string
): HostMatch | null {
  const hostname = normalizeHostname(hostHeader)
  if (!hostname) return null

  const publicHost = env.publicHost.toLowerCase()
  const appHost = env.appHost.toLowerCase()
  const portalHost = env.portalHost.toLowerCase()

  // 1. Exact match: Public Website (kiyu.test or localhost fallback)
  if (
    hostname === publicHost ||
    hostname === `www.${publicHost}` ||
    hostname === "localhost" ||
    hostname === "127.0.0.1"
  ) {
    return {
      context: "public",
      internalBasePath: "/ctx/public",
    }
  }

  // 2. Exact match: App Console (app.kiyu.test)
  if (hostname === appHost) {
    return {
      context: "app",
      internalBasePath: "/ctx/app",
    }
  }

  // 3. Exact match: Platform Portal (portal.kiyu.test)
  if (hostname === portalHost) {
    return {
      context: "portal",
      internalBasePath: "/ctx/portal",
    }
  }

  // 4. Tenant subdomain: {tenant}.kiyu.test (or {tenant}.localhost for local testing)
  let tenantSlug: string | undefined

  if (hostname.endsWith(`.${publicHost}`)) {
    tenantSlug = hostname.slice(0, -(publicHost.length + 1))
  } else if (hostname.endsWith(".localhost")) {
    tenantSlug = hostname.slice(0, -".localhost".length)
  }

  // Reject empty or multi-level subdomains or reserved words
  if (
    !tenantSlug ||
    tenantSlug.includes(".") ||
    ["www", "app", "portal", "api"].includes(tenantSlug)
  ) {
    return null
  }

  // Device routes under tenant host
  if (pathname === "/kiosk" || pathname.startsWith("/kiosk/")) {
    return {
      context: "devices",
      tenantSlug,
      internalBasePath: "/ctx/devices",
    }
  }

  if (pathname === "/display" || pathname.startsWith("/display/")) {
    return {
      context: "devices",
      tenantSlug,
      internalBasePath: "/ctx/devices",
    }
  }

  // Customer portal routes under tenant host
  if (pathname === "/customer" || pathname.startsWith("/customer/")) {
    return {
      context: "customer",
      tenantSlug,
      internalBasePath: "/ctx/customer",
    }
  }

  // Default: Tenant Workspace (includes /login, /invitation/accept, /workspace/*, /staff/*)
  return {
    context: "tenant",
    tenantSlug,
    internalBasePath: "/ctx/tenant",
  }
}
