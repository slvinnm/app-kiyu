import { redirect } from "next/navigation"
import { getAuthCookie } from "@/lib/auth/base-auth"

export default async function PortalRootPage() {
  const token = await getAuthCookie("portal")
  redirect(token ? "/dashboard" : "/login")
}
