/**
 * Route prefixes that require a signed-in session.
 *
 * This only decides *whether* to gate — the *role* check lives in each
 * workspace layout (`requireRole`), which reads the account from the API so a
 * stale cookie claim cannot grant access. Keeping the role lists next to the
 * layouts that render the workspace avoids two sources of truth.
 */
const GATED_PREFIXES = ["/admin", "/receptionist", "/staff", "/client"] as const

export function isGatedPath(pathname: string): boolean {
  return GATED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}
