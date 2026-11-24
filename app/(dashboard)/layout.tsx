import { redirect } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import { getVerifiedUser } from "@/lib/auth/guard"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // The API is the only authority on whether this account still exists and
  // what role it holds. Memoised, so the per-role layouts and pages share this
  // one `/auth/me` call per navigation.
  if (!(await getVerifiedUser())) {
    redirect("/login")
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />

      <SidebarInset>
        <SiteHeader />

        <main className="flex min-w-0 flex-1 flex-col overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
