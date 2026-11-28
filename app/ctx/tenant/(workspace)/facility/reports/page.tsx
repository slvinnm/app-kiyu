"use client"

import { useCallback, useEffect, useState } from "react"
import { useTenantContext } from "@/contexts/tenant/tenant-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { browserApi } from "@/lib/api/browser-client"
import { ApiException } from "@/lib/api/transport"
import {
  AlertCircleIcon,
  BarChart3Icon,
  FileBarChart2Icon,
  RefreshCwIcon,
} from "lucide-react"

interface ReportResult {
  [key: string]: unknown
}

type ReportKey =
  | "queue-overview"
  | "daily-queue"
  | "waiting-time"
  | "service-duration"
  | "peak-hours"
  | "cancellation-no-show"
  | "department-performance"
  | "staff-performance"
  | "facility-comparison"

const REPORT_TABS: Array<{
  key: ReportKey
  label: string
  description: string
}> = [
  {
    key: "queue-overview",
    label: "Queue Overview",
    description: "Aggregated queue and visit counts",
  },
  {
    key: "daily-queue",
    label: "Daily Queue",
    description: "Day-by-day totals and completions",
  },
  {
    key: "waiting-time",
    label: "Waiting Time",
    description: "Average wait minutes",
  },
  {
    key: "service-duration",
    label: "Service Duration",
    description: "Average service time",
  },
  {
    key: "peak-hours",
    label: "Peak Hours",
    description: "Hourly ticket distribution",
  },
  {
    key: "cancellation-no-show",
    label: "Cancellations",
    description: "Cancelled / skipped / no-show rates",
  },
  {
    key: "department-performance",
    label: "Departments",
    description: "Completion rate per department",
  },
  {
    key: "staff-performance",
    label: "Staff",
    description: "Completed tickets per staff",
  },
  {
    key: "facility-comparison",
    label: "Facilities",
    description: "Cross-facility comparison",
  },
]

export default function FacilityReportsPage() {
  const { activeFacilityId } = useTenantContext()

  const [activeKey, setActiveKey] = useState<ReportKey>("queue-overview")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [data, setData] = useState<ReportResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [notEntitled, setNotEntitled] = useState(false)

  const load = useCallback(
    async (key: ReportKey) => {
      if (!activeFacilityId) return
      setIsLoading(true)
      setError("")
      setNotEntitled(false)
      setData(null)
      try {
        const res = await browserApi<ReportResult>(
          "tenant",
          `/reports/${key}`,
          {
            params: {
              facility_id: activeFacilityId,
              ...(from ? { from } : {}),
              ...(to ? { to } : {}),
            },
          }
        )
        setData(res)
      } catch (err: unknown) {
        if (err instanceof ApiException) {
          if (err.status === 403) {
            setNotEntitled(true)
            return
          }
          if (err.status === 404) {
            setError("This report is currently unreleased or unavailable.")
            return
          }
        }
        setError(err instanceof Error ? err.message : "Failed to load report")
      } finally {
        setIsLoading(false)
      }
    },
    [activeFacilityId, from, to]
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      void load(activeKey)
    }, 0)
    return () => clearTimeout(timer)
  }, [load, activeKey])

  const activeReport = REPORT_TABS.find((r) => r.key === activeKey)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Facility analytics. Each report is gated by its own entitlement.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void load(activeKey)}
        >
          <RefreshCwIcon data-icon="inline-start" />
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {REPORT_TABS.map((r) => (
          <Button
            key={r.key}
            size="sm"
            variant={activeKey === r.key ? "default" : "outline"}
            onClick={() => setActiveKey(r.key)}
          >
            {r.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4">
          <div>
            <CardTitle>{activeReport?.label}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {activeReport?.description}
            </p>
          </div>
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              void load(activeKey)
            }}
          >
            <FieldGroup className="flex flex-row flex-wrap gap-3">
              <Field>
                <FieldLabel htmlFor="from">From</FieldLabel>
                <Input
                  id="from"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-40"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="to">To</FieldLabel>
                <Input
                  id="to"
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-40"
                />
              </Field>
            </FieldGroup>
            <Button type="submit" variant="outline" size="sm">
              Apply Range
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
            </div>
          ) : notEntitled ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
              <BarChart3Icon className="size-8 text-muted-foreground" />
              <p className="font-medium">Report not available</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Your current plan does not include this report. Upgrade the
                organization plan to unlock it.
              </p>
              <Badge variant="outline">Entitlement required</Badge>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : data ? (
            <ReportRenderer data={data} />
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
              <FileBarChart2Icon className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No data for the selected range.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ReportRenderer({ data }: { data: ReportResult }) {
  const period =
    (data.period as { from?: string; to?: string } | undefined) ?? undefined

  return (
    <div className="flex flex-col gap-4">
      {period && (
        <p className="text-xs text-muted-foreground">
          Period: {period.from ?? "—"} → {period.to ?? "—"}
        </p>
      )}
      <pre className="max-h-[28rem] overflow-auto rounded-lg bg-muted p-4 text-xs">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}
