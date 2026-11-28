"use client"

import { useState } from "react"
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
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { browserApi } from "@/lib/api/browser-client"
import {
  AlertCircleIcon,
  RefreshCwIcon,
  SearchIcon,
  TicketIcon,
} from "lucide-react"

interface TicketItem {
  id: number
  queue_number: string
  status: string
  priority: number
  created_at: string
  station?: { id: number; name: string; code: string } | null
  queue_session?: { customer?: { name: string } | null } | null
}

interface Paginated<T> {
  data: T[]
  total: number
}

export function TicketsView() {
  const { activeFacilityId } = useTenantContext()
  const [search, setSearch] = useState("")

  const { data, isLoading, error, reload } = useAsyncData<
    TicketItem[]
  >(async () => {
    if (!activeFacilityId) return []
    const res = await browserApi<Paginated<TicketItem>>("tenant", "/tickets", {
      params: {
        facility_id: activeFacilityId,
        per_page: 50,
        ...(search ? { search } : {}),
      },
    })
    return res.data ?? []
  }, [activeFacilityId, search])

  const tickets = data ?? []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tickets</h1>
          <p className="text-sm text-muted-foreground">
            Search and inspect queue tickets
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

      <InputGroup className="max-w-sm">
        <InputGroupInput
          placeholder="Search ticket # or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
      </InputGroup>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : tickets.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TicketIcon />
            </EmptyMedia>
            <EmptyTitle>No tickets found</EmptyTitle>
            <EmptyDescription>
              Tickets created from intake or bookings appear here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Station</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono font-medium">
                    {t.queue_number}
                  </TableCell>
                  <TableCell>
                    {t.queue_session?.customer?.name ?? "Walk-in"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {t.station ? `${t.station.name} (${t.station.code})` : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">P{t.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{t.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(t.created_at).toLocaleString()}
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
