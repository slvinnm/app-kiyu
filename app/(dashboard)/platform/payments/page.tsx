import { ReceiptText } from "lucide-react"

import { ConsolePageHeader } from "@/components/console/console-page-header"
import { SimpleTable } from "@/components/console/simple-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

import { getApiErrorMessage } from "@/lib/api/error"
import { getPlatformPaymentsServer } from "@/lib/api/platform-server"
import { formatDateTime } from "@/lib/reception/format"

import type { PlatformPayment } from "@/types/platform"

function formatMoney(amount: number, currency: string): string {
  return `${currency} ${new Intl.NumberFormat("id-ID").format(amount)}`
}

const STATUS_VARIANT = {
  PAID: "secondary",
  PENDING: "outline",
  FAILED: "destructive",
  REFUNDED: "outline",
} as const

export default async function Page() {
  let rows: PlatformPayment[] = []
  let error: string | null = null

  try {
    rows = (await getPlatformPaymentsServer({ per_page: 100 })).data
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat transaksi.")
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <ConsolePageHeader
        context="Platform"
        title="Daftar Transaksi"
        description="Pembayaran dari penyedia pembayaran, dengan status dan referensinya."
        icon={<ReceiptText className="size-5" />}
      />

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Data transaksi tidak tersedia</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <SimpleTable
          rows={rows}
          getRowKey={(row) => row.id}
          emptyMessage="Belum ada transaksi."
          columns={[
            {
              header: "Tenant",
              cell: (row) => row.subscription?.tenant?.name ?? "-",
            },
            { header: "Penyedia", cell: (row) => row.provider },
            {
              header: "Referensi",
              cell: (row) => (
                <span className="font-mono text-xs">
                  {row.provider_transaction_id ?? "-"}
                </span>
              ),
            },
            {
              header: "Jumlah",
              cell: (row) => formatMoney(row.amount, row.currency),
            },
            {
              header: "Status",
              cell: (row) => (
                <Badge variant={STATUS_VARIANT[row.status]}>{row.status}</Badge>
              ),
            },
            {
              header: "Dibayar",
              cell: (row) => (row.paid_at ? formatDateTime(row.paid_at) : "-"),
            },
          ]}
        />
      )}
    </div>
  )
}
