import { requireRole, requireTenantHost } from "@/lib/auth/guard"

/**
 * Staff workspace guard (`/staff`, PRD §8.5).
 *
 * Staff only. Service Transfer lives here; manual registration and customer
 * management do not.
 */
export default async function StaffLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // A workspace page must be served on a real tenant subdomain (PRD §7).
  await requireTenantHost()

  await requireRole(["staff"])

  return children
}
