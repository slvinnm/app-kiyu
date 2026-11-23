import { normalizeRole } from "@/types/auth"

import type { UserRole } from "@/types/auth"

type RouteRule = {
  prefix: string
  roles: UserRole[]
}

/**
 * Mirrors the API's `role:` middleware. Admin is allowed into the receptionist
 * and staff workspaces because the API grants admin those routes too.
 */
export const routeRules: RouteRule[] = [
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/receptionist", roles: ["admin", "receptionist"] },
  { prefix: "/staff", roles: ["admin", "staff"] },
  { prefix: "/client", roles: ["client"] },
]

export function getRouteRule(pathname: string): RouteRule | null {
  const matching = routeRules.filter(
    (rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)
  )

  return matching.sort((a, b) => b.prefix.length - a.prefix.length)[0] ?? null
}

export function isRoleAllowed(role: unknown, roles: UserRole[]): boolean {
  const normalizedRole = normalizeRole(role)

  return normalizedRole !== null && roles.includes(normalizedRole)
}
