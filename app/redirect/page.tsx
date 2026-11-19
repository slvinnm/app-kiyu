import { redirect } from "next/navigation"

import { getSession } from "@/lib/auth/session"
import { getRoleRedirect } from "@/lib/auth/redirect"

export default async function DashboardPage() {
  const session = await getSession()

  if (!session?.user?.role) {
    redirect("/login")
  }

  redirect(getRoleRedirect(session.user.role))
}
