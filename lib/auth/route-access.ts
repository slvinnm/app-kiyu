/**
 * Route prefixes that require a signed-in session.
 *
 * Only decides *whether* to gate — the *role and application* checks live in
 * each workspace layout (`requireRole`), which reads the account from the API so
 * a stale cookie claim cannot grant access. Prefixes are per application
 * context (PRD §6.1, §8).
 */
const PORTAL_PREFIXES = ["/platform", "/portal"] as const

const WORKSPACE_PREFIXES = [
  "/facility",
  "/operator",
  "/staff",
  "/client",
] as const

export type RouteContext = "portal" | "workspace" | null

/** Application context a pathname belongs to, or `null` for a public path. */
export function routeContextOf(pathname: string): RouteContext {
  const matches = (prefixes: readonly string[]): boolean =>
    prefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )

  if (matches(PORTAL_PREFIXES)) {
    return "portal"
  }

  if (matches(WORKSPACE_PREFIXES)) {
    return "workspace"
  }

  return null
}

/** True when the pathname is inside a protected application area. */
export function isGatedPath(pathname: string): boolean {
  return routeContextOf(pathname) !== null
}
