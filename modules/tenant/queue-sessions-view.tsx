"use client"

import { useAsyncData } from "@/hooks/use-async-data"
import { useTenantContext } from "@/contexts/tenant/tenant-context"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { browserApi } from "@/lib/api/browser-client"
import { AlertCircleIcon, ClipboardListIcon, RefreshCwIcon } from "lucide-react"

interface QueueSessionItem {
  id: number
  status: string
  priority: number
  created_at: string
  department?: { name: string } | null
  customer?: { name: string } | null
}

interface Paginated<T> {
  data: T[]
  total: number
}

export function QueueSessionsView() {
  const { activeFacilityId } = useTenantContext()

  const { data, isLoading, error, reload } = useAsyncData<
    QueueSessionItem[]
  >(async () => {
    if (!activeFacilityId) return []
    const res = await browserApi<Paginated<QueueSessionItem>>(
      "tenant",
      "/queue-sessions",
      {
        params: { facility_id: activeFacilityId, per_page: 50 },
      }
    )
    return res.data ?? []
  }, [activeFacilityId])

  const sessions = data ?? []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Queue Sessions</h1>
          <p className="text-sm text-muted-foreground">
            Visit records and lifecycle status
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reload}>
          <RefreshCwIcon data-icon="inline-start" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : sessions.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClipboardListIcon />
            </EmptyMedia>
            <EmptyTitle>No queue sessions</EmptyTitle>
            <EmptyDescription>
              Customer visits appear here as sessions are created.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono">#{s.id}</TableCell>
                  <TableCell className="font-medium">
                    {s.customer?.name ?? "Walk-in"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.department?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">P{s.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{s.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(s.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
