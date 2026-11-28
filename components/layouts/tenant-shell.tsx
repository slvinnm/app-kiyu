"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTenantContext } from "@/contexts/tenant/tenant-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  AlertCircleIcon,
  Building2Icon,
  LogOutIcon,
  MenuIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavLinkItem {
  href: string
  label: string
}

type NavEntry = NavLinkItem | { type: "separator" }

const ROLE_NAV: Record<"facility_admin" | "operator", NavEntry[]> = {
  facility_admin: [
    { href: "/facility/dashboard", label: "Dashboard" },
    { href: "/facility/reception", label: "Reception" },
    { href: "/facility/queue-monitor", label: "Queue Monitor" },
    { href: "/facility/tickets", label: "Tickets" },
    { href: "/facility/queue-sessions", label: "Queue Sessions" },
    { href: "/facility/customers", label: "Customers" },
    { type: "separator" },
    { href: "/facility/devices", label: "Devices" },
    { href: "/facility/reports", label: "Reports" },
  ],
  operator: [
    { href: "/operator/reception", label: "Reception" },
    { href: "/operator/queue-monitor", label: "Queue Monitor" },
    { href: "/operator/tickets", label: "Tickets" },
    { href: "/operator/customers", label: "Customers" },
  ],
}

export function TenantShell({
  role,
  children,
}: {
  role: "facility_admin" | "operator"
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const {
    user,
    facilities,
    activeFacility,
    activeFacilityId,
    setActiveFacilityId,
    isLoading,
    error,
  } = useTenantContext()

  const items = ROLE_NAV[role]

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
      <div className="flex min-h-screen bg-background">
        <aside className="hidden w-64 border-r p-4 lg:block">
          <Skeleton className="mb-6 h-8 w-40" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </aside>
        <div className="flex flex-1 flex-col">
          <header className="flex h-16 items-center justify-between border-b px-6">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-8 w-24" />
          </header>
          <main className="flex-1 p-6">
            <Skeleton className="h-80 w-full rounded-xl" />
          </main>
        </div>
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
              {error || "Please sign in again to access this workspace."}
            </EmptyDescription>
          </EmptyHeader>
          <Button render={<Link href="/login" />} nativeButton={false}>
            Go to Login
          </Button>
        </Empty>
      </div>
    )
  }

  if (
    user.role !== role &&
    !(role === "operator" && user.role === "facility_admin")
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AlertCircleIcon />
            </EmptyMedia>
            <EmptyTitle>Access denied</EmptyTitle>
            <EmptyDescription>
              Your role ({user.role}) does not have access to this workspace.
            </EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" onClick={() => void handleLogout()}>
            Sign Out
          </Button>
        </Empty>
      </div>
    )
  }

  if (facilities.length === 0 || !activeFacilityId) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Building2Icon />
            </EmptyMedia>
            <EmptyTitle>No assigned facility</EmptyTitle>
            <EmptyDescription>
              Your account is not assigned to any active facility. Contact your
              organization administrator.
            </EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" onClick={() => void handleLogout()}>
            Sign Out
          </Button>
        </Empty>
      </div>
    )
  }

  const facilityItems = facilities.map((f) => ({
    label: `${f.name} (${f.code})`,
    value: String(f.id),
  }))

  const navContent = (
    <ul className="flex flex-col gap-1">
      {items.map((item, idx) => {
        if ("type" in item) {
          return (
            <li key={`sep-${idx}`} className="my-2">
              <Separator />
            </li>
          )
        }
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {item.label}
            </Link>
          </li>
        )
      })}
    </ul>
  )

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 flex-col border-r bg-background lg:flex">
        <div className="flex h-16 items-center border-b px-4">
          <span className="truncate text-lg font-semibold">
            {user.tenant?.name ?? "Workspace"}
          </span>
        </div>

        {facilities.length > 1 && (
          <div className="border-b p-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Active Facility
            </p>
            <Select
              items={facilityItems}
              value={String(activeFacilityId)}
              onValueChange={(v) => {
                if (v) setActiveFacilityId(Number(v))
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {facilityItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto p-4">{navContent}</nav>

        <div className="border-t p-4">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.role}</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-4 border-b px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    aria-label="Menu"
                  />
                }
              >
                <MenuIcon />
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>{user.tenant?.name ?? "Workspace"}</SheetTitle>
                </SheetHeader>
                <nav className="mt-4">{navContent}</nav>
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2">
              <Building2Icon className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {activeFacility?.name}
              </span>
              {activeFacility?.code && (
                <Badge variant="outline" className="font-mono text-xs">
                  {activeFacility.code}
                </Badge>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleLogout()}
          >
            <LogOutIcon data-icon="inline-start" />
            Sign Out
          </Button>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
