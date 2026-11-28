"use client"

import { useEffect, useState } from "react"
import { useAsyncData } from "@/hooks/use-async-data"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { MonitorIcon, TvIcon } from "lucide-react"

interface StationSnapshot {
  station_id: number
  station_name: string
  station_code: string
  station_type: string
  department_name: string | null
  current_calling: {
    queue_number: string
    status: string
    called_at: string | null
  } | null
  waiting_count: number
  upcoming_queue_numbers: string[]
}

interface PairStatus {
  paired: boolean
  tenantSlug: string
}

export default function DisplayPage() {
  const [pairingCode, setPairingCode] = useState("")
  const [pairLoading, setPairLoading] = useState(false)

  const statusQuery = useAsyncData<PairStatus>(async () => {
    const res = await fetch("/api/session/device/display/status", {
      credentials: "include",
      cache: "no-store",
    })
    return (await res.json()) as PairStatus
  }, [])

  const queueQuery = useAsyncData<StationSnapshot[]>(async () => {
    const res = await fetch("/api/device/display/queue", {
      credentials: "include",
      cache: "no-store",
    })
    if (!res.ok) return []
    const json = (await res.json()) as { data?: StationSnapshot[] }
    return json.data ?? []
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      void queueQuery.reload()
    }, 10000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isPaired = statusQuery.data?.paired ?? false
  const snapshots = queueQuery.data ?? []

  async function handlePair(e: React.FormEvent) {
    e.preventDefault()
    setPairLoading(true)
    try {
      const res = await fetch("/api/session/device/display/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pairing_code: pairingCode }),
        credentials: "include",
      })
      if (res.ok) {
        setPairingCode("")
        await statusQuery.reload()
        await queueQuery.reload()
      }
    } finally {
      setPairLoading(false)
    }
  }

  if (statusQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Skeleton className="h-64 w-full max-w-md rounded-xl bg-gray-800" />
      </div>
    )
  }

  if (!isPaired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4">
        <Card className="w-full max-w-md border-gray-700 bg-gray-900 text-white">
          <CardHeader className="text-center">
            <TvIcon className="mx-auto size-12 text-primary" />
            <CardTitle className="mt-2">Pair Display Device</CardTitle>
            <CardDescription className="text-gray-400">
              Enter the pairing code shown in the admin dashboard to activate
              this display.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePair} className="flex flex-col gap-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="pairing_code">Pairing Code</FieldLabel>
                  <Input
                    id="pairing_code"
                    value={pairingCode}
                    onChange={(e) =>
                      setPairingCode(e.target.value.toUpperCase())
                    }
                    required
                    maxLength={8}
                    placeholder="ABC12345"
                    autoComplete="off"
                    className="border-gray-600 bg-gray-800 text-center font-mono text-2xl tracking-widest text-white"
                  />
                </Field>
              </FieldGroup>
              <Button type="submit" className="w-full" disabled={pairLoading}>
                {pairLoading && <Spinner data-icon="inline-start" />}
                Pair Device
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <TvIcon className="size-6 text-primary" />
            <span className="text-lg font-bold">KIYU Queue Display</span>
          </div>
          <Badge variant="outline" className="border-green-600 text-green-400">
            LIVE
          </Badge>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 lg:p-8">
        {queueQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <Skeleton className="h-40 rounded-xl bg-gray-800" />
            <Skeleton className="h-40 rounded-xl bg-gray-800" />
            <Skeleton className="h-40 rounded-xl bg-gray-800" />
          </div>
        ) : snapshots.length === 0 ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MonitorIcon />
                </EmptyMedia>
                <EmptyTitle>No active stations</EmptyTitle>
                <EmptyDescription>
                  Configure stations in the admin dashboard.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {snapshots.map((s) => (
              <Card key={s.station_id} className="border-gray-700 bg-gray-900">
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base text-white">
                      {s.station_name}
                    </CardTitle>
                    <p className="text-xs text-gray-400">
                      {s.department_name ?? "—"} ·{" "}
                      <span className="font-mono text-gray-300">
                        {s.station_code}
                      </span>
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-gray-600 text-gray-400"
                  >
                    {s.station_type}
                  </Badge>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-baseline justify-between rounded-lg bg-gray-800 p-4">
                    <div>
                      <p className="text-xs text-gray-400">NOW SERVING</p>
                      <p className="font-mono text-4xl font-bold text-white">
                        {s.current_calling?.queue_number ?? "—"}
                      </p>
                    </div>
                    <Badge className="bg-blue-500 text-white">
                      Waiting: {s.waiting_count}
                    </Badge>
                  </div>
                  {s.upcoming_queue_numbers.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-xs text-gray-400">NEXT:</span>
                      {s.upcoming_queue_numbers.map((num, idx) => (
                        <Badge
                          key={`${num}-${idx}`}
                          variant="outline"
                          className="border-gray-600 bg-gray-800 font-mono text-xs text-gray-300"
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
      </main>
    </div>
  )
}
