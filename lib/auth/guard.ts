import "server-only"

import { notFound, redirect } from "next/navigation"
import { cache } from "react"
import { headers } from "next/headers"

import { getSession } from "@/lib/auth/session"
import { roleApplication } from "@/lib/auth/redirect"
import { fetchVerifiedUser } from "@/lib/auth/verify"
import { classifyHost, requestHostname } from "@/lib/tenant/host"

import { normalizeRole } from "@/types/auth"

import type { VerifiedUser } from "@/lib/auth/verify"
import type { UserRole } from "@/types/auth"

/**
 * The application context the current request is being served for, derived from
 * the hostname (PRD §3.4). Unknown hosts are a 404: a host that is neither the
 * marketing site, the portal, the API, nor a tenant subdomain has nothing to
 * render.
 */
export const getHostContext = cache(async () => {
  const headerList = await headers()

  return classifyHost(requestHostname(headerList))
})

/**
 * Resolves the signed-in user from the API, memoised per request.
 *
 * The signed cookie is only a claim: its role is a snapshot from login time.
 * Every authorization decision reads the account as the API sees it now, so a
 * demotion or reassignment takes effect immediately. Returns `null` when
 * unauthenticated or the token was rejected; `undefined` when the API is
 * unreachable.
 */
const getVerifiedUser = cache(
  async (): Promise<VerifiedUser | null | undefined> => {
    const session = await getSession()

    if (!session) {
      return null
    }

    return fetchVerifiedUser(session)
  }
)

/**
 * Server-component guard for a protected application area.
 *
 * Enforces, in order: an authenticated account, a role in `roles`, and that the
 * role belongs to the application the host is serving. A portal role on a tenant
 * host (or vice versa) is refused even with a valid session, so the two
 * frontends cannot be crossed (PRD §5.1, §6.2).
 *
 * An API outage (`undefined`) fails open on the cookie snapshot; the page's own
 * requests surface the failure and must not bounce every operator to login on a
 * transient blip.
 */
export async function requireRole(
  roles: readonly UserRole[]
): Promise<VerifiedUser> {
  const user = await getVerifiedUser()

  if (user === null) {
    redirect("/login")
  }

  const verifiedUser = user ?? (await fallbackToCookieUser())

  const role = normalizeRole(verifiedUser.role)

  if (!role || !roles.includes(role)) {
    redirect("/unauthorized")
  }

  // The host must serve the application this role belongs to.
  const host = await getHostContext()
  const application = roleApplication(role)

  if (host.kind === "portal" && application !== "portal") {
    redirect("/unauthorized")
  }

  if (host.kind === "tenant" && application !== "workspace") {
    redirect("/unauthorized")
  }

  return verifiedUser
}

/**
 * Guard for a page that lives on a tenant subdomain.
 *
 * The slug must be a real, active tenant (resolved by the API), otherwise a
 * genuine 404 is thrown — never a default tenant (PRD §7).
 */
export async function requireTenantHost(): Promise<string> {
  const host = await getHostContext()

  if (host.kind !== "tenant") {
    notFound()
  }

  return host.slug
}

/**
 * Builds a user from the signed cookie claims. Only used when the API is
 * unreachable; the claims gate the render, but every real data request still
 * goes through the API's own authorization.
 */
async function fallbackToCookieUser(): Promise<VerifiedUser> {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
    tenant_id: session.user.tenant_id ?? null,
    tenant: session.user.tenant ?? null,
    facilities: session.user.facilities ?? [],
    facility_ids: session.user.facility_ids ?? [],
    station_id: session.user.station_id ?? null,
  }
}

export { getVerifiedUser }
