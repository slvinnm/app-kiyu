import { redirect } from "next/navigation"

import { getSession } from "@/lib/auth/session"
import { getRoleRedirect } from "@/lib/auth/redirect"
import { normalizeRole } from "@/types/auth"

export default async function DashboardPage() {
  const session = await getSession()

  if (!session?.user?.role) {
    redirect("/login")
  }

  // Patients must finish onboarding before reaching the dashboard.
  if (normalizeRole(session.user.role) === "patient") {
    const { getCurrentPatientServer } = await import("@/lib/api/patient-server")

    try {
      const current = await getCurrentPatientServer()

      if (!current.profile) {
        redirect("/patient/onboarding")
      }
    } catch {
      redirect("/patient/onboarding")
    }
  }

  redirect(getRoleRedirect(session.user.role))
}
