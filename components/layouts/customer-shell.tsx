"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useCustomerContext } from "@/contexts/customer/customer-context"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  AlertCircleIcon,
  HomeIcon,
  CalendarPlusIcon,
  ListOrderedIcon,
  UserIcon,
  LogOutIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/customer", label: "Home", icon: HomeIcon },
  { href: "/customer/book", label: "Book", icon: CalendarPlusIcon },
  { href: "/customer/queue", label: "My Queue", icon: ListOrderedIcon },
  { href: "/customer/profile", label: "Profile", icon: UserIcon },
]

export function CustomerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoading, error } = useCustomerContext()

  async function handleLogout() {
    await fetch("/api/session/customer/logout", {
      method: "POST",
      credentials: "include",
    })
    router.push("/login?mode=customer")
    router.refresh()
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
        <div className="flex h-14 items-center justify-between border-b px-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="size-8 rounded-full" />
        </div>
        <main className="flex-1 p-4">
          <Skeleton className="h-72 rounded-xl" />
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
              {error || "Please sign in to continue."}
            </EmptyDescription>
          </EmptyHeader>
          <Button
            render={<Link href="/login?mode=customer" />}
            nativeButton={false}
          >
            Go to Login
          </Button>
        </Empty>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background shadow-sm md:max-w-2xl">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {user.tenant?.name ?? "KIYU"}
          </p>
          <p className="truncate text-xs text-muted-foreground">{user.name}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => void handleLogout()}
          aria-label="Sign out"
        >
          <LogOutIcon />
        </Button>
      </header>

      <main className="flex-1 pb-20">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex w-full max-w-md items-stretch border-t bg-background/95 backdrop-blur md:max-w-2xl">
        {NAV.map((item) => {
          const Icon = item.icon
          const isActive =
            item.href === "/customer"
              ? pathname === "/customer"
              : pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
