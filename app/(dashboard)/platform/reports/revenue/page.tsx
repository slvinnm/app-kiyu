import { Wallet } from "lucide-react"

import {
  ConsolePageHeader,
  ConsoleStat,
} from "@/components/console/console-page-header"
import { SimpleTable } from "@/components/console/simple-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { getApiErrorMessage } from "@/lib/api/error"
import { getRevenueReportServer } from "@/lib/api/platform-server"

export default async function Page() {
  let report = null
  let error: string | null = null

  try {
    report = await getRevenueReportServer()
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat laporan pendapatan.")
  }

  const currency = report?.series[0]?.currency ?? null

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <ConsolePageHeader
        context="Platform"
        title="Laporan Pendapatan"
        description="Pembayaran terverifikasi (PAID) per bulan — kas yang benar-benar diterima."
        icon={<Wallet className="size-5" />}
      />

      {error || !report ? (
        <Alert variant="destructive">
          <AlertTitle>Laporan tidak tersedia</AlertTitle>
          <AlertDescription>{error ?? "Terjadi kesalahan."}</AlertDescription>
        </Alert>
      ) : (
        <>
          <ConsoleStat
            label="Total Pendapatan"
            value={`${currency ?? ""} ${new Intl.NumberFormat("id-ID").format(report.total)}`}
            hint="Seluruh pembayaran PAID dalam rentang"
            icon={<Wallet className="size-4" />}
          />

          <SimpleTable
            rows={report.series}
            getRowKey={(row) => row.month}
            emptyMessage="Belum ada pembayaran dalam rentang ini."
            columns={[
              { header: "Bulan", cell: (row) => row.month },
              {
                header: "Pendapatan",
                cell: (row) => (
                  <span className="tabular-nums">
                    {row.currency}{" "}
                    {new Intl.NumberFormat("id-ID").format(row.amount)}
                  </span>
                ),
              },
              {
                header: "Jumlah Pembayaran",
                cell: (row) => (
                  <span className="tabular-nums">{row.payments}</span>
                ),
              },
            ]}
          />
        </>
      )}
    </div>
  )
}
