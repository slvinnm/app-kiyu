import { CalendarClock } from "lucide-react"

import {
  ConsolePageHeader,
  ConsoleStat,
} from "@/components/console/console-page-header"
import { SimpleTable } from "@/components/console/simple-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

import { getApiErrorMessage } from "@/lib/api/error"
import { getSubscriptionReportServer } from "@/lib/api/platform-server"

export default async function Page() {
  let report = null
  let error: string | null = null

  try {
    report = await getSubscriptionReportServer()
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat laporan langganan.")
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <ConsolePageHeader
        context="Platform"
        title="Laporan Langganan"
        description="Distribusi langganan per status dan per paket, serta churn dalam rentang."
        icon={<CalendarClock className="size-5" />}
      />

      {error || !report ? (
        <Alert variant="destructive">
          <AlertTitle>Laporan tidak tersedia</AlertTitle>
          <AlertDescription>{error ?? "Terjadi kesalahan."}</AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="flex flex-wrap gap-4">
            <ConsoleStat
              label="Churn dalam Rentang"
              value={report.churned_in_range}
              hint="Langganan dibatalkan"
            />
            <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-4">
              {Object.entries(report.by_status).map(([status, total]) => (
                <Badge key={status} variant="secondary" className="gap-1">
                  {status}
                  <span className="tabular-nums">{total}</span>
                </Badge>
              ))}
            </div>
          </div>

          <SimpleTable
            rows={report.by_plan}
            getRowKey={(row) => row.plan_id}
            emptyMessage="Belum ada paket."
            columns={[
              {
                header: "Paket",
                cell: (row) => (
                  <div className="flex flex-col">
                    <span className="font-medium">{row.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {row.code}
                    </span>
                  </div>
                ),
              },
              {
                header: "Langganan Aktif",
                cell: (row) => (
                  <span className="tabular-nums">
                    {row.active_subscriptions}
                  </span>
                ),
              },
            ]}
          />
        </>
      )}
    </div>
  )
}
