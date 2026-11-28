import { headers } from "next/headers"
import { TenantSidebar } from "@/components/layouts/tenant-sidebar"

export default async function TenantWorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headerStore = await headers()
  const tenantName = headerStore.get("x-kiyu-tenant-name") ?? "Organization"
  const tenantSlug = headerStore.get("x-kiyu-tenant-slug") ?? ""

  return (
    <div className="flex min-h-screen bg-background">
      <TenantSidebar
        tenantName={tenantName}
        tenantSlug={tenantSlug}
        role="facility_admin"
        facilities={[]}
        activeFacilityId={null}
      />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  )
}
