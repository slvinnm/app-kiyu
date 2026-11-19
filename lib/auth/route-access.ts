import { normalizeRole } from "@/types/auth"

import type { UserRole } from "@/types/auth"

type RouteRule = {
  prefix: string
  roles: UserRole[]
}

export const routeRules: RouteRule[] = [
  {
    prefix: "/admin",
    roles: ["admin"],
  },
  {
    prefix: "/receptionist",
    roles: ["receptionist"],
  },
  {
    prefix: "/doctor",
    roles: ["doctor"],
  },
  {
    prefix: "/nurse",
    roles: ["nurse"],
  },
  {
    prefix: "/pharmacy",
    roles: ["pharmacy"],
  },
  {
    prefix: "/lab",
    roles: ["lab"],
  },
  {
    prefix: "/patient",
    roles: ["patient"],
  },
]

export function getRouteRule(pathname: string): RouteRule | null {
  const matchingRules = routeRules.filter(
    (rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)
  )

  return (
    matchingRules.sort((a, b) => b.prefix.length - a.prefix.length)[0] ?? null
  )
}

export function isRoleAllowed(role: unknown, roles: UserRole[]): boolean {
  const normalizedRole = normalizeRole(role)

  return normalizedRole !== null && roles.includes(normalizedRole)
}
