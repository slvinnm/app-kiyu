"use client"

import Link from "next/link"
import { useAsyncData } from "@/hooks/use-async-data"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  ChevronRightIcon,
  ClockIcon,
  ListOrderedIcon,
} from "lucide-react"

interface QueueSessionItem {
  id: number
  status: string
  priority: number
  created_at: string
  session_number?: string
  department?: { name: string; code: string } | null
}

interface Paginated<T> {
  data: T[]
  total: number
}

export default function CustomerQueuePage() {
  const sessionsQuery = useAsyncData<QueueSessionItem[]>(async () => {
    const res = await browserApi<Paginated<QueueSessionItem>>(
      "customer",
      "/queue-sessions",
      {
        params: { per_page: 30 },
      }
    )
    return res.data ?? []
  }, [])

  const sessions = sessionsQuery.data ?? []

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">My Queue</h1>
        <p className="text-sm text-muted-foreground">
          Your visit history and active sessions
        </p>
      </div>

      {sessionsQuery.error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{sessionsQuery.error}</AlertDescription>
        </Alert>
      )}

      {sessionsQuery.isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
      ) : sessions.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ListOrderedIcon />
            </EmptyMedia>
            <EmptyTitle>No visits yet</EmptyTitle>
            <EmptyDescription>Book a visit to get started.</EmptyDescription>
          </EmptyHeader>
          <Link href="/customer/book">
            <Badge variant="secondary">Book a Visit</Badge>
          </Link>
        </Empty>
      ) : (
        <div className="flex flex-col gap-2">
          {sessions.map((s) => (
            <Link key={s.id} href={`/customer/queue/${s.id}`}>
              <Card>
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">
                      {s.department?.name ?? "Visit"}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ClockIcon className="size-3" />
                      {new Date(s.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{s.status}</Badge>
                    <ChevronRightIcon className="size-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
