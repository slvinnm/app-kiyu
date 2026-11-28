"use client"

import Link from "next/link"
import { useAsyncData } from "@/hooks/use-async-data"
import { useCustomerContext } from "@/contexts/customer/customer-context"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { browserApi } from "@/lib/api/browser-client"
import {
  AlertCircleIcon,
  CalendarPlusIcon,
  ListOrderedIcon,
  TicketIcon,
  ClockIcon,
  ChevronRightIcon,
} from "lucide-react"

interface QueueSessionItem {
  id: number
  status: string
  priority: number
  created_at: string
  department?: { name: string; code: string } | null
}

interface CustomerProfile {
  id: number
  name: string
  phone: string | null
  email: string | null
  address: string | null
}

interface Paginated<T> {
  data: T[]
  total: number
}

export default function CustomerHomePage() {
  const { user } = useCustomerContext()

  const sessionsQuery = useAsyncData<QueueSessionItem[]>(async () => {
    const res = await browserApi<Paginated<QueueSessionItem>>(
      "customer",
      "/queue-sessions",
      {
        params: { per_page: 5 },
      }
    )
    return res.data ?? []
  }, [])

  const profileQuery = useAsyncData<CustomerProfile | null>(async () => {
    try {
      return await browserApi<CustomerProfile>("customer", "/profile")
    } catch {
      return null
    }
  }, [])

  const sessions = sessionsQuery.data ?? []
  const activeSession = sessions.find((s) =>
    ["WAITING", "IN_PROGRESS", "AWAITING_CHECKIN"].includes(s.status)
  )
  const hasProfile = Boolean(profileQuery.data)

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold tracking-tight">
          Hello, {user?.name ?? "there"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your visits and bookings with{" "}
          {user?.tenant?.name ?? "this organization"}.
        </p>
      </div>

      {sessionsQuery.error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{sessionsQuery.error}</AlertDescription>
        </Alert>
      )}

      {!hasProfile && !profileQuery.isLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Complete your profile</CardTitle>
            <CardDescription>
              Add your name and contact details before booking a visit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              render={<Link href="/customer/profile" />}
              nativeButton={false}
              className="w-full"
            >
              Set up Profile
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Visit</CardTitle>
          <CardDescription>Your active queue status</CardDescription>
        </CardHeader>
        <CardContent>
          {sessionsQuery.isLoading ? (
            <Skeleton className="h-24 rounded-lg" />
          ) : activeSession ? (
            <Link
              href={`/customer/queue/${activeSession.id}`}
              className="block"
            >
              <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">
                    {activeSession.department?.name ?? "Visit"}
                  </span>
                  <Badge variant="secondary" className="w-fit">
                    {activeSession.status}
                  </Badge>
                </div>
                <ChevronRightIcon className="size-5 text-muted-foreground" />
              </div>
            </Link>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <TicketIcon />
                </EmptyMedia>
                <EmptyTitle>No active visit</EmptyTitle>
                <EmptyDescription>
                  Book a visit to join the queue.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/customer/book">
          <Card className="h-full">
            <CardContent className="flex flex-col items-center gap-2 py-6">
              <CalendarPlusIcon className="size-8 text-primary" />
              <span className="text-sm font-medium">Book a Visit</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/customer/queue">
          <Card className="h-full">
            <CardContent className="flex flex-col items-center gap-2 py-6">
              <ListOrderedIcon className="size-8 text-primary" />
              <span className="text-sm font-medium">My Queue</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Visits</CardTitle>
          <Link
            href="/customer/queue"
            className="text-xs text-primary hover:underline"
          >
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {sessionsQuery.isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-14 rounded-lg" />
              <Skeleton className="h-14 rounded-lg" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No visits yet.</p>
          ) : (
            <ul className="flex flex-col divide-y">
              {sessions.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/customer/queue/${s.id}`}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">
                        {s.department?.name ?? "Visit"}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ClockIcon className="size-3" />
                        {new Date(s.created_at).toLocaleString()}
                      </span>
                    </div>
                    <Badge variant="outline">{s.status}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
