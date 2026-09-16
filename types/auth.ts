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

export type AuthUser = {
  id: string
  name: string
  email: string
  role: UserRole
  profile?: unknown
}
