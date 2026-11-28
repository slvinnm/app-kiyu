import { CustomerProvider } from "@/contexts/customer/customer-context"
import { CustomerShell } from "@/components/layouts/customer-shell"

export default function CustomerPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CustomerProvider>
      <CustomerShell>{children}</CustomerShell>
    </CustomerProvider>
  )
}
