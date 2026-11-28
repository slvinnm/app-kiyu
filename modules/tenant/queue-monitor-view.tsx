"use client"

import { useState, useEffect } from "react"
import { useAsyncData } from "@/hooks/use-async-data"
import { useTenantContext } from "@/contexts/tenant/tenant-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Field, FieldLabel } from "@/components/ui/field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { browserApi } from "@/lib/api/browser-client"
import { AlertCircleIcon, Building2Icon, RefreshCwIcon } from "lucide-react"

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

export function QueueMonitorView() {
  const { activeFacilityId } = useTenantContext()
  const [autoRefresh, setAutoRefresh] = useState(true)

  const {
    data: snapshots,
    isLoading,
    error: fetchError,
    reload,
  } = useAsyncData(async () => {
    if (!activeFacilityId) return [] as StationSnapshot[]
    const res = await browserApi<StationSnapshot[]>(
      "tenant",
      "/queue/monitor",
      {
        params: { facility_id: activeFacilityId },
      }
    )
    return res
  }, [activeFacilityId])

  useEffect(() => {
    if (!autoRefresh) return
    const timer = setInterval(() => void reload(), 10000)
    return () => clearInterval(timer)
  }, [autoRefresh, reload])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Queue Monitor</h1>
          <p className="text-sm text-muted-foreground">
            Live queue status across active stations
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Field orientation="horizontal">
            <Switch
              id="auto_refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <FieldLabel htmlFor="auto_refresh">Auto-refresh (10s)</FieldLabel>
          </Field>
          <Button variant="outline" size="sm" onClick={reload}>
            <RefreshCwIcon data-icon="inline-start" />
            Refresh
          </Button>
        </div>
      </div>

      {fetchError && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      )}

      {snapshots?.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Building2Icon />
            </EmptyMedia>
            <EmptyTitle>No active stations</EmptyTitle>
            <EmptyDescription>
              Configure active stations to monitor live queues.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {snapshots!.map((s) => (
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
                <div className="flex items-baseline justify-between rounded-lg bg-muted p-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Serving</p>
                    <p className="font-mono text-2xl font-bold">
                      {s.current_calling?.queue_number ?? "—"}
                    </p>
                  </div>
                  <Badge variant="secondary">Waiting: {s.waiting_count}</Badge>
                </div>
                {s.upcoming_queue_numbers.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-xs text-muted-foreground">Next:</span>
                    {s.upcoming_queue_numbers.map((num, idx) => (
                      <Badge
                        key={`${num}-${idx}`}
                        variant="outline"
                        className="font-mono text-xs"
                      >
                        {num}
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
