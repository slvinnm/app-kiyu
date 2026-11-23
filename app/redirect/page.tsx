import { redirect } from "next/navigation"

import { getSession } from "@/lib/auth/session"
import { getRoleRedirect } from "@/lib/auth/redirect"
import { normalizeRole } from "@/types/auth"

export default async function DashboardPage() {
  const session = await getSession()

  if (!session?.user?.role) {
    redirect("/login")
  }

  // Clients must finish onboarding before reaching the dashboard.
  if (normalizeRole(session.user.role) === "client") {
    const { getCurrentClientServer } = await import("@/lib/api/clients-server")

    try {
      const current = await getCurrentClientServer()

      if (!current.profile) {
        redirect("/client/onboarding")
      }
    } catch {
      redirect("/client/onboarding")
    }
  }

  redirect(getRoleRedirect(session.user.role))
}
