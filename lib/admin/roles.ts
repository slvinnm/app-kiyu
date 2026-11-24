import { USER_ROLES } from "@/types/auth"

import type { UserRole } from "@/types/auth"

/**
 * Roles an administrator may assign from the user form.
 *
 * Mirrors `App\Enums\UserRole::tenantValues()` minus `tenant_admin`: the
 * canonical owner is not created or re-roled through user management, and
 * `platform_admin` never belongs to a tenant (PRD §3.2).
 */
export const ASSIGNABLE_ROLE_OPTIONS = [
  { value: "facility_admin", label: "Admin Fasilitas" },
  { value: "operator", label: "Operator" },
  { value: "staff", label: "Staff" },
  { value: "client", label: "Klien" },
] as const satisfies readonly { value: UserRole; label: string }[]

/** Display labels for every API role, including the ones not assignable here. */
const ROLE_LABELS: Record<UserRole, string> = {
  platform_admin: "Platform",
  tenant_admin: "Admin Tenant",
  facility_admin: "Admin Fasilitas",
  operator: "Operator",
  staff: "Staff",
  client: "Klien",
}

export function staffRoleLabel(role: string): string {
  return ROLE_LABELS[role as UserRole] ?? role
}

/** Type guard used where a raw API string must narrow to a known role. */
export function isKnownRole(role: string): role is UserRole {
  return (USER_ROLES as readonly string[]).includes(role)
}
