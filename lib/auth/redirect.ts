import { normalizeRole } from "@/types/auth"

const ROLE_DASHBOARDS: Record<string, string> = {
  admin: "/admin/dashboard",
  receptionist: "/receptionist/dashboard",
  staff: "/staff/dashboard",
  client: "/client/dashboard",
}

export function getRoleRedirect(role: unknown): string {
  const normalizedRole = normalizeRole(role)

  return normalizedRole ? ROLE_DASHBOARDS[normalizedRole] : "/unauthorized"
}
