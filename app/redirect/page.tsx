import { redirect } from "next/navigation"

import { getCurrentClientServer } from "@/lib/api/clients-server"
import { getRoleRedirect } from "@/lib/auth/redirect"
import { getVerifiedUser } from "@/lib/auth/guard"
import { normalizeRole } from "@/types/auth"

export default async function DashboardPage() {
  // Role comes from the API, not the cookie: a demoted account must land on the
  // right dashboard immediately instead of after the cookie expires.
  const user = await getVerifiedUser()

  if (!user) {
    redirect("/login")
  }

  const role = normalizeRole(user.role)

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
