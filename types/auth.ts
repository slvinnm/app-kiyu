/**
 * Tenant roles emitted by the API (`App\Enums\UserRole`).
 *
 * `platform_admin` is included so a platform account normalizes to a real value
 * rather than an unknown one; every tenant workspace guard then denies it. The
 * platform console is a separate application area that does not exist yet.
 */
export const USER_ROLES = [
  "platform_admin",
  "tenant_admin",
  "facility_admin",
  "operator",
  "staff",
  "client",
] as const

export type UserRole = (typeof USER_ROLES)[number]

/** Roles that operate inside a tenant, i.e. everything except the platform. */
export const TENANT_ROLES = [
  "tenant_admin",
  "facility_admin",
  "operator",
  "staff",
  "client",
] as const satisfies readonly UserRole[]

export type TenantRole = (typeof TENANT_ROLES)[number]

/**
 * What each role may do, mirroring the backend `role:` middleware on
 * `routes/api.php`.
 *
 * This is a *rendering* map, never an authorization boundary — the API is the
 * only authority. Keeping it here means navigation, buttons and guards read one
 * table instead of scattering `role === '...'` checks through components.
 */
export const CAPABILITIES = {
  "admin.access": ["tenant_admin", "facility_admin"],
  "config.write": ["tenant_admin", "facility_admin"],
  "users.manage": ["tenant_admin", "facility_admin"],
  "facilities.create": ["tenant_admin"],
  "billing.manage": ["tenant_admin"],
  "audit.read": ["tenant_admin"],
  "devices.manage": ["tenant_admin", "facility_admin"],
  "reception.operate": ["tenant_admin", "facility_admin", "operator"],
  "tickets.operate": [
    "tenant_admin",
    "facility_admin",
    "operator",
    "staff",
  ],
  "transfers.create": ["tenant_admin", "facility_admin", "staff"],
  "reports.summary": ["tenant_admin", "operator"],
  "reports.export": ["tenant_admin"],
  "portal.use": ["client"],
} as const satisfies Record<string, readonly TenantRole[]>

export type Capability = keyof typeof CAPABILITIES

/** Whether a normalized role holds a capability. */
export function hasCapability(
  role: UserRole | null,
  capability: Capability
): boolean {
  return (
    role !== null &&
    (CAPABILITIES[capability] as readonly UserRole[]).includes(role)
  )
}

/**
 * Normalizes a raw role from the API/session to a known `UserRole`.
 * Returns `null` for unknown roles so route guards fail closed.
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
  facility_ids?: number[]
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
    facility_ids: Array.isArray(user.facility_ids) ? user.facility_ids : [],
    station_id: user.station_id ?? null,
  }
}
