import { CalendarClock } from "lucide-react"

import { ConsolePageHeader } from "@/components/console/console-page-header"
import { SimpleTable } from "@/components/console/simple-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

import { getApiErrorMessage } from "@/lib/api/error"
import { getPlatformSubscriptionsServer } from "@/lib/api/platform-server"
import { formatDateTime } from "@/lib/reception/format"

import type { PlatformSubscription } from "@/types/platform"

export default async function Page() {
  let rows: PlatformSubscription[] = []
  let error: string | null = null

  try {
    rows = (await getPlatformSubscriptionsServer({ per_page: 100 })).data
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat langganan.")
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <ConsolePageHeader
        context="Platform"
        title="Daftar Langganan"
        description="Seluruh langganan tenant beserta status dan periodenya."
        icon={<CalendarClock className="size-5" />}
      />

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Data langganan tidak tersedia</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <SimpleTable
          rows={rows}
          getRowKey={(row) => row.id}
          emptyMessage="Belum ada langganan."
          columns={[
            {
              header: "Tenant",
              cell: (row) => (
                <span className="font-medium">{row.tenant?.name ?? row.tenant_id}</span>
              ),
            },
            { header: "Paket", cell: (row) => row.plan?.name ?? "-" },
            {
              header: "Status",
              cell: (row) => <Badge variant="secondary">{row.status}</Badge>,
            },
            { header: "Interval", cell: (row) => row.billing_interval },
            {
              header: "Akhir Periode",
              cell: (row) =>
                row.current_period_end ? formatDateTime(row.current_period_end) : "-",
            },
          ]}
        />
      )}
    </div>
  )
}
