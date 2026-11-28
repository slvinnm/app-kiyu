"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTenantContext } from "@/contexts/tenant/tenant-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { AlertCircleIcon, Building2Icon, LogOutIcon } from "lucide-react"

/**
 * Staff uses a focused Service Workstation shell — NO admin sidebar.
 */
export default function StaffWorkstationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, activeFacility, isLoading, error } = useTenantContext()

  async function handleLogout() {
    await fetch("/api/session/tenant/logout", {
      method: "POST",
      credentials: "include",
    })
    router.push("/login")
    router.refresh()
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="flex h-16 items-center justify-between border-b px-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-24" />
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 p-6">
          <Skeleton className="h-80 rounded-xl" />
        </main>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AlertCircleIcon />
            </EmptyMedia>
            <EmptyTitle>Session unavailable</EmptyTitle>
            <EmptyDescription>
              {error || "Please sign in to access your workstation."}
            </EmptyDescription>
          </EmptyHeader>
          <Button render={<Link href="/login" />} nativeButton={false}>
            Go to Login
          </Button>
        </Empty>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-16 items-center justify-between gap-4 border-b px-4 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold">
            {user.tenant?.name ?? "KIYU"}
          </span>
          {activeFacility && (
            <Badge variant="outline" className="gap-1">
              <Building2Icon className="size-3" />
              {activeFacility.name}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {user.name}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleLogout()}
          >
            <LogOutIcon data-icon="inline-start" />
            Sign Out
          </Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 p-4 lg:p-8">
        {children}
      </main>
    </div>
  )
}
