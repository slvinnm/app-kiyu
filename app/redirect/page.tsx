import { redirect } from "next/navigation"

import { getCurrentClientServer } from "@/lib/api/clients-server"
import { getRoleRedirect } from "@/lib/auth/redirect"
import { getVerifiedUser } from "@/lib/auth/guard"
import { getSession } from "@/lib/auth/session"
import { normalizeRole } from "@/types/auth"

export default async function DashboardPage() {
  // Role comes from the API, not the cookie: a demoted account must land on the
  // right dashboard immediately instead of after the cookie expires.
  const verified = await getVerifiedUser()

  if (verified === null) {
    redirect("/login")
  }

  // On an API outage (`undefined`) fall back to the cookie's snapshot; the
  // target workspace re-checks the role against the API before rendering.
  const role = verified
    ? normalizeRole(verified.role)
    : normalizeRole((await getSession())?.user.role)

  // Clients must finish onboarding before reaching the dashboard. Only a
  // successful "no profile" answer redirects; an API failure falls through to
  // the dashboard, whose own load error is handled there.
  if (role === "client") {
    const current = await getCurrentClientServer().catch(() => null)

    if (current && !current.profile) {
      redirect("/client/onboarding")
    }
  }

  redirect(getRoleRedirect(role))
}