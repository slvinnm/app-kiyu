import { requireRole, requireTenantHost } from "@/lib/auth/guard"

/**
 * Operator workspace guard (`/operator`, PRD §8.4).
 *
 * Operator only. FacilityAdmin has its own workspace; TenantAdmin never calls
 * queues on a tenant host.
 */
export default async function OperatorLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // A workspace page must be served on a real tenant subdomain (PRD §7).
  await requireTenantHost()

  await requireRole(["operator"])

  return children
}
