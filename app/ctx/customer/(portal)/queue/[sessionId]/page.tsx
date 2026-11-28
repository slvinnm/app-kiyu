"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { useAsyncData } from "@/hooks/use-async-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { browserApi } from "@/lib/api/browser-client"
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  ClockIcon,
  TicketIcon,
} from "lucide-react"

interface TicketRow {
  id: number
  queue_number: string
  status: string
  priority: number
  called_at: string | null
  started_at: string | null
  station?: { name: string; code: string } | null
  workflow_step?: { name: string } | null
}

interface SessionDetail {
  id: number
  status: string
  priority: number
  session_number?: string
  created_at: string
  department?: { name: string; code: string } | null
  queue_tickets?: TicketRow[]
}

export default function CustomerSessionDetailPage() {
  const params = useParams()
  const sessionId = Number(params.sessionId)

  const query = useAsyncData<SessionDetail>(async () => {
    return browserApi<SessionDetail>("customer", `/queue-sessions/${sessionId}`)
  }, [sessionId])

  const session = query.data

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          render={<Link href="/customer/queue" />}
          nativeButton={false}
          aria-label="Back"
        >
          <ArrowLeftIcon />
        </Button>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Visit Detail</h1>
          <p className="text-xs text-muted-foreground">
            {session?.department?.name ?? "Visit"} · #{sessionId}
          </p>
        </div>
      </div>

      {query.error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{query.error}</AlertDescription>
        </Alert>
      )}

      {query.isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : !session ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AlertCircleIcon />
            </EmptyMedia>
            <EmptyTitle>Visit not found</EmptyTitle>
            <EmptyDescription>This visit could not be loaded.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Status</CardTitle>
              <Badge variant="secondary">{session.status}</Badge>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Priority</span>
                <span>P{session.priority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Department</span>
                <span>{session.department?.name ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(session.created_at).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              {!session.queue_tickets || session.queue_tickets.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <TicketIcon />
                    </EmptyMedia>
                    <EmptyTitle>No ticket issued yet</EmptyTitle>
                    <EmptyDescription>
                      A ticket is issued once your registration is completed.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <ul className="flex flex-col divide-y">
                  {session.queue_tickets.map((t) => (
                    <li key={t.id} className="flex flex-col gap-1 py-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-lg font-bold">
                          {t.queue_number}
                        </span>
                        <Badge variant="outline">{t.status}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {t.station && <span>Station: {t.station.name}</span>}
                        {t.workflow_step && (
                          <span>Step: {t.workflow_step.name}</span>
                        )}
                        {t.called_at && (
                          <span className="flex items-center gap-1">
                            <ClockIcon className="size-3" />
                            Called {new Date(t.called_at).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
