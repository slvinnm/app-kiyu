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
 * An API outage fails open here (the page's own data requests will surface the
 * problem).
 */
export async function requireRole(roles: UserRole[]): Promise<VerifiedUser> {
  const user = await getVerifiedUser()

  if (!user) {
    redirect("/login")
  }

  const role = normalizeRole(user.role)

  if (!role || !roles.includes(role)) {
    redirect("/unauthorized")
  }

  return user
}

export { getVerifiedUser }
