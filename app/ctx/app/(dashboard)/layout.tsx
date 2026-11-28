import Link from "next/link"
import { SidebarProvider } from "@/components/ui/sidebar"

export default function AppConsoleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <aside className="hidden w-64 flex-col border-r bg-background lg:block">
          <nav className="flex h-full flex-col p-4">
            <Link href="/dashboard" className="mb-4 text-lg font-semibold">
              KIYU App Console
            </Link>
            <ul className="flex flex-col gap-2">
              <li>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/facilities"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  Facilities
                </Link>
              </li>
              <li>
                <Link
                  href="/team"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  Team & Invitations
                </Link>
              </li>
              <li>
                <Link
                  href="/monitoring"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  Monitoring
                </Link>
              </li>
              <li>
                <Link
                  href="/reports"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  Reports
                </Link>
              </li>
              <li>
                <Link
                  href="/billing"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  Billing
                </Link>
              </li>
            </ul>
          </nav>
        </aside>
        <main className="flex-1 overflow-auto p-6 lg:p-8">{children}</main>
      </div>
    </SidebarProvider>
  )
}
