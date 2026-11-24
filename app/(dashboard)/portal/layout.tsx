import { requireRole } from "@/lib/auth/guard"

/**
 * Portal guard (`app.kiyu.test`, PRD §5.1).
 *
 * PlatformAdmin and TenantAdmin only. `requireRole` reads the role from the API
 * and also refuses a role that does not belong to the portal application, so a
 * workspace user with a valid session cannot render the portal.
 *
 * The visual shell is shared (`(dashboard)/layout.tsx`); the application
 * boundary is this guard, intentionally not navigation visibility.
 */
export default async function PortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireRole(["platform_admin", "tenant_admin"])

  return children
}
