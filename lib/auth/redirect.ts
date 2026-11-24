import { normalizeRole } from "@/types/auth"

import type { UserRole } from "@/types/auth"

/**
 * Landing page per role, after login or a visit to `/redirect`.
 *
 * Order matters: the page and redirect both call this with whatever the API
 * reported, and an unknown or platform role must land on the access-denied page
 * rather than a workspace it cannot render.
 */
const ROLE_DASHBOARDS: Record<UserRole, string> = {
  platform_admin: "/unauthorized",
  tenant_admin: "/admin/dashboard",
  facility_admin: "/admin/dashboard",
  operator: "/receptionist/dashboard",
  staff: "/staff/dashboard",
  client: "/client/dashboard",
}

export function getRoleRedirect(role: unknown): string {
  const normalizedRole = normalizeRole(role)

  return normalizedRole ? ROLE_DASHBOARDS[normalizedRole] : "/unauthorized"
}
