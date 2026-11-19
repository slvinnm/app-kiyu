export const USER_ROLES = [
  "admin",
  "staff",
  "doctor",
  "patient",
  "receptionist",
  "nurse",
  "pharmacy",
  "lab",
] as const

export type UserRole = (typeof USER_ROLES)[number]

/**
 * Backend role aliases mapped onto this application's role names.
 * Kept intentionally small: only roles the backend actually emits.
 */
export const ROLE_ALIASES: Record<string, UserRole> = {
  pharmacist: "pharmacy",
}

/**
 * Normalizes a raw role coming from the API/session into a known `UserRole`.
 * Returns `null` for unknown roles so callers can deny access safely.
 */
export function normalizeRole(role: unknown): UserRole | null {
  if (typeof role !== "string") {
    return null
  }

  const normalized = role.trim().toLowerCase()

  if (!normalized) {
    return null
  }

  if ((USER_ROLES as readonly string[]).includes(normalized)) {
    return normalized as UserRole
  }

  return ROLE_ALIASES[normalized] ?? null
}

export type AuthUser = {
  id: number
  name: string
  email: string
  role: string
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

/**
 * Keeps only the claims the UI needs in the signed session cookie. Patient
 * profile data (PII) is intentionally excluded; fetch /auth/me server-side if
 * it is ever needed.
 */
export function toSessionUser(user: AuthUser): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department_id: user.department_id ?? null,
    station_id: user.station_id ?? null,
  }
}
