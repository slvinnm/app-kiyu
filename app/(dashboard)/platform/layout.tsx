import { requireRole } from "@/lib/auth/guard"

/**
 * Platform console guard (`/platform`, PRD §8.1).
 *
 * PlatformAdmin only: the SaaS business console, never a tenant's queue menus.
 */
export default async function PlatformLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireRole(["platform_admin"])

  return children
}
