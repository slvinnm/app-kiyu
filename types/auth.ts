/**
 * Tenant roles emitted by the API. `platform_admin` is excluded on purpose:
 * the non-platform frontend never serves platform operators.
 */
export const USER_ROLES = ["admin", "receptionist", "staff", "client"] as const

export type UserRole = (typeof USER_ROLES)[number]

/**
 * Normalizes a raw role from the API/session to a known `UserRole`.
 * Returns `null` for platform accounts and unknown roles so route guards fail
 * closed.
 */
export function normalizeRole(role: unknown): UserRole | null {
  if (typeof role !== "string") {
    return null
  }

  const normalized = role.trim().toLowerCase()

  return (USER_ROLES as readonly string[]).includes(normalized)
    ? (normalized as UserRole)
    : null
}

export type AuthUser = {
  id: number
  name: string
  email: string
  role: string
  tenant_id?: number | null
  facility_id?: number | null
  department_id?: number | null
  station_id?: number | null
  profile?: unknown
}

export type AuthResponse = {
  message: string
  data: {
    token: string
    user: AuthUser
  }
}

export function toSessionUser(user: AuthUser): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tenant_id: user.tenant_id ?? null,
    facility_id: user.facility_id ?? null,
    department_id: user.department_id ?? null,
    station_id: user.station_id ?? null,
  }
}
