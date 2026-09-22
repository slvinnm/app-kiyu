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
    prefix: "/staff",
    roles: ["staff"],
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

export function isRoleAllowed(
  role: unknown,
  roles: UserRole[]
): role is UserRole {
  return typeof role === "string" && roles.includes(role as UserRole)
}
