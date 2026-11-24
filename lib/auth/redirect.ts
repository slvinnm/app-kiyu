import { normalizeRole } from "@/types/auth"

import type { UserRole } from "@/types/auth"

/**
 * Landing page per role.
 *
 * Portal roles (platform_admin, tenant_admin) live on `app.kiyu.test`; workspace
 * roles (facility_admin, operator, staff, client) live on the tenant subdomain.
 * The host guard refuses a role on the wrong application, so this map is only
 * reached for a correctly-classified host.
 */
const ROLE_DASHBOARDS: Record<UserRole, string> = {
  platform_admin: "/platform/dashboard",
  tenant_admin: "/portal/dashboard",
  facility_admin: "/facility/dashboard",
  operator: "/operator/dashboard",
  staff: "/staff/dashboard",
  client: "/client/dashboard",
}

export function getRoleRedirect(role: unknown): string {
  const normalizedRole = normalizeRole(role)

  return normalizedRole ? ROLE_DASHBOARDS[normalizedRole] : "/unauthorized"
}

/** Application context a role may use (PRD §5.1). */
export function roleApplication(role: unknown): "portal" | "workspace" | null {
  const normalized = normalizeRole(role)

  if (normalized === null) {
    return null
  }

  return normalized === "platform_admin" || normalized === "tenant_admin"
    ? "portal"
    : "workspace"
}
