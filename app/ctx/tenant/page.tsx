import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { getAuthCookie } from "@/lib/auth/base-auth"
import { http } from "@/lib/api/transport"
import type { AuthSession } from "@/lib/auth/base-auth"

export default async function TenantRootPage() {
  const headerStore = await headers()
  const tenantSlug = headerStore.get("x-kiyu-tenant-slug") ?? undefined

  const token = await getAuthCookie("tenant")
  if (!token) {
    redirect("/login")
  }

  let user: AuthSession["user"]
  try {
    const response = await http<{ data: AuthSession["user"] }>("/auth/me", {
      context: "tenant",
      tenantSlug,
      token,
    })
    user = response.data
  } catch {
    redirect("/login")
  }

  if (user.role === "facility_admin") {
    redirect("/facility/dashboard")
  }
  if (user.role === "operator") {
    redirect("/operator/reception")
  }
  if (user.role === "staff") {
    redirect("/staff")
  }

  redirect("/login")
}
