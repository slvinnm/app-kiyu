import { redirect } from "next/navigation"

import { getRoleRedirect } from "@/lib/auth/redirect"
import { getVerifiedUser } from "@/lib/auth/guard"

export default async function Page() {
  const user = await getVerifiedUser()

  if (!user) {
    redirect("/login")
  }

  redirect(getRoleRedirect(user.role))
}
