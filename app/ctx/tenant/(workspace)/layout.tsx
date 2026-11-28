import { TenantProvider } from "@/contexts/tenant/tenant-context"

export default function TenantWorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <TenantProvider>{children}</TenantProvider>
}
