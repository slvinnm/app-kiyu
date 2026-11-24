import { requireRole, requireTenantHost } from "@/lib/auth/guard"

export default async function ClientLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // A workspace page must be served on a real tenant subdomain (PRD §7).
  await requireTenantHost()

  await requireRole(["client"])

  return children
}
