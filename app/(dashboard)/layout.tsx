import { redirect } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import { getSession } from "@/lib/auth/session"
import { isSessionTokenValid } from "@/lib/auth/verify"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getSession()

  if (!session?.user?.role) {
    redirect("/login")
  }

  // The Proxy already checks this; repeating it here means a revoked token can
  // never render the dashboard shell even when the Proxy is bypassed (server
  // actions, cached navigations, or a Proxy matcher miss).
  if (!(await isSessionTokenValid(session))) {
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
