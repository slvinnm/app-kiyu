import { redirect } from "next/navigation"
import { getAuthCookie } from "@/lib/auth/base-auth"

export default async function AppRootPage() {
  const token = await getAuthCookie("app")
  redirect(token ? "/dashboard" : "/login")
}
