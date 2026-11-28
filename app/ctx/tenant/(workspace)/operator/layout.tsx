import { TenantShell } from "@/components/layouts/tenant-shell"

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <TenantShell role="operator">{children}</TenantShell>
}
