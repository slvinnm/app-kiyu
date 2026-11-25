import { Activity } from "lucide-react"

import { ConsolePageHeader } from "@/components/console/console-page-header"
import { SimpleTable } from "@/components/console/simple-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

import { getApiErrorMessage } from "@/lib/api/error"
import { getWebhookEventsServer } from "@/lib/api/platform-server"
import { formatDateTime } from "@/lib/reception/format"

import type { WebhookEvent } from "@/types/platform"

const STATUS_VARIANT = {
  PROCESSED: "secondary",
  RECEIVED: "outline",
  FAILED: "destructive",
} as const

export default async function Page() {
  let rows: WebhookEvent[] = []
  let error: string | null = null

  try {
    rows = (await getWebhookEventsServer({ per_page: 100 })).data
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat riwayat webhook.")
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <ConsolePageHeader
        context="Platform"
        title="Riwayat Webhook"
        description="Event dari penyedia pembayaran dan status pemrosesannya."
        icon={<Activity className="size-5" />}
      />

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Riwayat webhook tidak tersedia</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <SimpleTable
          rows={rows}
          getRowKey={(row) => row.id}
          emptyMessage="Belum ada event webhook."
          columns={[
            { header: "Penyedia", cell: (row) => row.provider },
            {
              header: "Event",
              cell: (row) => (
                <div className="flex flex-col">
                  <span className="font-medium">{row.event_type}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {row.event_id}
                  </span>
                </div>
              ),
            },
            {
              header: "Status",
              cell: (row) => (
                <Badge variant={STATUS_VARIANT[row.status]}>{row.status}</Badge>
              ),
            },
            {
              header: "Diterima",
              cell: (row) =>
                row.received_at ? formatDateTime(row.received_at) : "-",
            },
            {
              header: "Error",
              cell: (row) => (
                <span className="text-xs text-destructive">
                  {row.error ?? "-"}
                </span>
              ),
            },
          ]}
        />
      )}
    </div>
  )
}
