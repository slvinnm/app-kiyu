import { TrendingUp, Wallet } from "lucide-react"

import { ConsolePageHeader, ConsoleStat } from "@/components/console/console-page-header"
import { SimpleTable } from "@/components/console/simple-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { getApiErrorMessage } from "@/lib/api/error"
import { getGrowthReportServer } from "@/lib/api/platform-server"

export default async function Page() {
  let report = null
  let error: string | null = null

  try {
    report = await getGrowthReportServer()
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat laporan pertumbuhan tenant.")
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <ConsolePageHeader
        context="Platform"
        title="Pertumbuhan Tenant"
        description="Jumlah tenant baru per bulan dalam 12 bulan terakhir."
        icon={<TrendingUp className="size-5" />}
      />

      {error || !report ? (
        <Alert variant="destructive">
          <AlertTitle>Laporan tidak tersedia</AlertTitle>
          <AlertDescription>{error ?? "Terjadi kesalahan."}</AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <ConsoleStat
              label="Total Tenant"
              value={report.total_tenants}
              icon={<Wallet className="size-4" />}
            />
            <ConsoleStat
              label="Bulan Tercatat"
              value={report.series.length}
              hint="Bulan dengan pendaftaran dalam rentang"
            />
          </div>

          <SimpleTable
            rows={report.series}
            getRowKey={(row) => row.month}
            emptyMessage="Belum ada pendaftaran tenant dalam rentang ini."
            columns={[
              { header: "Bulan", cell: (row) => row.month },
              {
                header: "Tenant Baru",
                cell: (row) => (
                  <span className="tabular-nums">{row.tenants}</span>
                ),
              },
            ]}
          />
        </>
      )}
    </div>
  )
}
