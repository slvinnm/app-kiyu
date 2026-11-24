import { redirect } from "next/navigation"

import { getRoleRedirect } from "@/lib/auth/redirect"
import { getVerifiedUser } from "@/lib/auth/guard"
import { getSession } from "@/lib/auth/session"
import { normalizeRole } from "@/types/auth"

export default async function Page() {
  const verified = await getVerifiedUser()

  if (verified === null) {
    redirect("/login")
  }

  // On an API outage (`undefined`) fall back to the cookie's snapshot so a
  // visitor lands on their dashboard instead of a login loop; the workspace
  // re-checks the role against the API before rendering.
  const role = verified
    ? normalizeRole(verified.role)
    : normalizeRole((await getSession())?.user.role)

  redirect(getRoleRedirect(role))
}