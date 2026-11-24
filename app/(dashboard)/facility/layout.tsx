import { requireRole, requireTenantHost } from "@/lib/auth/guard"

/**
 * Facility workspace guard (`/facility`, PRD §8.3).
 *
 * FacilityAdmin only. The layout also proves the request is on a real, active
 * tenant subdomain (the tenant host guard kicks in per page through
 * `getHostContext` in the shared shell).
 */
export default async function FacilityLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // A workspace page must be served on a real tenant subdomain (PRD §7).
  await requireTenantHost()

  await requireRole(["facility_admin"])

  return children
}
