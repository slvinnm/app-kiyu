"use client"

import Link from "next/link"
import { useAsyncData } from "@/hooks/use-async-data"
import { useTenantContext } from "@/contexts/tenant/tenant-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { browserApi } from "@/lib/api/browser-client"
import {
  AlertCircleIcon,
  Building2Icon,
  ClockIcon,
  ListOrderedIcon,
  UsersIcon,
} from "lucide-react"

interface StationSnapshot {
  station_id: number
  station_name: string
  station_code: string
  station_type: string
  department_id: number
  department_name: string | null
  current_calling: {
    queue_number: string
    status: string
    called_at: string | null
  } | null
  waiting_count: number
  upcoming_queue_numbers: string[]
}

interface DashboardPayload {
  snapshots: StationSnapshot[]
  ticketTotal: number
}

export default function FacilityDashboardPage() {
  const { activeFacilityId, activeFacility } = useTenantContext()

  const { data, isLoading, error } =
    useAsyncData<DashboardPayload>(async () => {
      if (!activeFacilityId) return { snapshots: [], ticketTotal: 0 }
      const [snapshots, ticketStats] = await Promise.all([
        browserApi<StationSnapshot[]>("tenant", "/queue/monitor", {
          params: { facility_id: activeFacilityId },
        }),
        browserApi<{ total: number }>("tenant", "/tickets/statistics", {
          params: { facility_id: activeFacilityId },
        }).catch(() => ({ total: 0 })),
      ])
      return { snapshots, ticketTotal: ticketStats.total ?? 0 }
    }, [activeFacilityId])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    )
  }

  const snapshots = data?.snapshots ?? []
  const totalWaiting = snapshots.reduce((sum, s) => sum + s.waiting_count, 0)
  const activeCalling = snapshots.filter(
    (s) => s.current_calling !== null
  ).length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {activeFacility?.name ?? "Facility Dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Live facility operational overview
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            render={<Link href="/facility/reception" />}
            nativeButton={false}
          >
            Open Reception
          </Button>
          <Button
            render={<Link href="/facility/devices" />}
            nativeButton={false}
          >
            Manage Devices
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <ListOrderedIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.ticketTotal ?? 0}</div>
            <p className="text-xs text-muted-foreground">Recorded tickets</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Waiting Now</CardTitle>
            <UsersIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWaiting}</div>
            <p className="text-xs text-muted-foreground">Across all stations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Currently Serving
            </CardTitle>
            <ClockIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCalling}</div>
            <p className="text-xs text-muted-foreground">Stations calling</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Active Stations
            </CardTitle>
            <Building2Icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{snapshots.length}</div>
            <p className="text-xs text-muted-foreground">
              Configured endpoints
            </p>
          </CardContent>
        </Card>
      </div>

      {snapshots.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Building2Icon />
            </EmptyMedia>
            <EmptyTitle>No active stations</EmptyTitle>
            <EmptyDescription>
              Configure departments and stations in the App Console to start
              serving queues.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {snapshots.map((s) => (
            <Card key={s.station_id}>
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div className="min-w-0">
                  <CardTitle className="truncate text-base">
                    {s.station_name}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {s.department_name ?? "—"} ·{" "}
                    <span className="font-mono">{s.station_code}</span>
                  </p>
                </div>
                <Badge variant="outline">{s.station_type}</Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Serving</p>
                    <p className="font-mono text-xl font-bold">
                      {s.current_calling?.queue_number ?? "—"}
                    </p>
                  </div>
                  <Badge variant="secondary">Waiting: {s.waiting_count}</Badge>
                </div>
                {s.upcoming_queue_numbers.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {s.upcoming_queue_numbers.map((q, i) => (
                      <Badge
                        key={`${q}-${i}`}
                        variant="outline"
                        className="font-mono text-xs"
                      >
                        {q}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
