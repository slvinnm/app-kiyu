"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { browserApi } from "@/lib/api/browser-client"
import { ApiException } from "@/lib/api/transport"
import {
  BuildingIcon,
  UsersIcon,
  LayersIcon,
  CreditCardIcon,
  LogOutIcon,
  TriangleAlertIcon,
} from "lucide-react"

interface AppUser {
  id: number
  name: string
  email: string
  role: string
  tenant: { id: number; name: string; slug: string; status: string } | null
  facilities: Array<{ id: number; name: string; code: string }>
}

interface AppDashboardData {
  tenant: { id: number; name: string; slug: string; status: string }
  counts: {
    facilities: number
    departments: number
    stations: number
    customers: number
    sessions_today: number
    waiting: number
    in_progress: number
    completed: number
  }
  subscription: {
    id: number
    status: string
    plan?: { id: number; code: string; name: string }
    current_period_end: string
    is_effective: boolean
  } | null
  usage: {
    facilities: number
    max_facilities: number
    kiosk_devices: number
    max_kiosk_devices: number
  }
}

export default function AppDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<AppUser | null>(null)
  const [data, setData] = useState<AppDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        // 1. Validate session
        const meRes = await fetch("/api/session/me", {
          credentials: "include",
          cache: "no-store",
        })
        if (meRes.status === 401) {
          router.replace("/login")
          return
        }
        if (!meRes.ok) {
          throw new Error("Failed to load session")
        }
        const me = (await meRes.json()) as { user: AppUser }
        if (cancelled) return
        setUser(me.user)

        // 2. Load dashboard data through the BFF proxy
        const dash = await browserApi<AppDashboardData>("app", "/dashboard")
        if (cancelled) return
        setData(dash)
      } catch (err: unknown) {
        if (cancelled) return
        if (err instanceof ApiException && err.status === 401) {
          router.replace("/login")
          return
        }
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard"
        )
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [router])

  async function handleLogout() {
    await fetch("/api/session/app/logout", {
      method: "POST",
      credentials: "include",
    })
    router.push("/login")
    router.refresh()
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TriangleAlertIcon />
            </EmptyMedia>
            <EmptyTitle>Dashboard unavailable</EmptyTitle>
            <EmptyDescription>{error}</EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Empty>
      </div>
    )
  }

  if (!data || !user) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {data.tenant.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {user.name} · Organization management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {data.subscription?.status ?? "No subscription"}
          </Badge>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOutIcon data-icon="inline-start" />
            Sign Out
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Facilities</CardTitle>
            <BuildingIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.counts.facilities}</div>
            <p className="text-xs text-muted-foreground">
              {data.usage.facilities} / {data.usage.max_facilities} capacity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Today Visits</CardTitle>
            <UsersIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.counts.sessions_today}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.counts.waiting} waiting · {data.counts.in_progress} serving
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <LayersIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.counts.departments}</div>
            <p className="text-xs text-muted-foreground">
              {data.counts.stations} stations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Subscription</CardTitle>
            <CreditCardIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.subscription?.plan?.name ?? "Trial"}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.subscription?.status ?? "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Facilities Management</CardTitle>
            <CardDescription>
              Each facility has its own departments, stations, and workflows
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button render={<Link href="/facilities" />} nativeButton={false}>
              Manage Facilities
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team &amp; Invitations</CardTitle>
            <CardDescription>
              Manage administrators, operators, and service staff across
              facilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              render={<Link href="/team" />}
              nativeButton={false}
            >
              Manage Team
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
