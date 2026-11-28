import { TenantShell } from "@/components/layouts/tenant-shell"

export default function FacilityAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <TenantShell role="facility_admin">{children}</TenantShell>
}
