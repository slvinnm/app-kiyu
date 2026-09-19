import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getRoleRedirect } from "@/lib/auth/redirect"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.role) {
    redirect("/login")
  }

  redirect(getRoleRedirect(session.user.role))
}
