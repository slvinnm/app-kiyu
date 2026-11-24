import "server-only"

import { cache } from "react"
import { redirect } from "next/navigation"

import { getSession } from "@/lib/auth/session"
import { fetchVerifiedUser } from "@/lib/auth/verify"

import { normalizeRole } from "@/types/auth"

import type { VerifiedUser } from "@/lib/auth/verify"
import type { UserRole } from "@/types/auth"

/**
 * Resolves the signed-in user from the API, memoised per request.
 *
 * The signed cookie is only a claim: its role/department/station are a snapshot
 * from login time. Every authorization decision must read the account as the API
 * sees it now, so a demotion or reassignment takes effect immediately instead of
 * lasting until the cookie expires.
 *
 * React's `cache` collapses the layout guard and the page guard into one
 * `/auth/me` call per navigation. Returns `null` when unauthenticated or the
 * token was rejected; `undefined` when the API is unreachable.
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
 * Server-component guard: asserts the signed-in user holds one of `roles`.
 *
 * Redirects to `/login` when unauthenticated or the token was revoked, and to
 * `/unauthorized` when the role is wrong. Returns the API-verified user so the
 * page can read department/station from the authoritative source.
 *
 * An API outage (`undefined`) fails open on the cookie's snapshot: the page's
 * own requests will surface the failure, and a transient blip must not bounce
 * every operator to the login screen.
 */
export async function requireRole(roles: UserRole[]): Promise<VerifiedUser> {
  const user = await getVerifiedUser()

  if (user === null) {
    redirect("/login")
  }

  const verifiedUser = user ?? (await fallbackToCookieUser())

  const role = normalizeRole(verifiedUser.role)

  if (!role || !roles.includes(role)) {
    redirect("/unauthorized")
  }

  return verifiedUser
}

/**
 * Builds a user from the signed cookie claims. Only used when the API is
 * unreachable; the claims are a login-time snapshot, so they gate the render
 * but every real data request still goes through the API's own authorization.
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
    facility_id: session.user.facility_id ?? null,
    department_id: session.user.department_id ?? null,
    station_id: session.user.station_id ?? null,
  }
}

export { getVerifiedUser }
