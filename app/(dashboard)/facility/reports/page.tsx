import { FileText } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { AdminPageHeader } from "@/components/facility/admin-page-header"
import { ReportSummaryView } from "@/components/facility/reports/report-summary"

import { getReportSummaryServer } from "@/lib/api/admin-server"
import { getApiErrorMessage } from "@/lib/api/error"

import type { ReportSummary } from "@/lib/api/admin-server"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const from = typeof params.from === "string" ? params.from : undefined
  const to = typeof params.to === "string" ? params.to : undefined

  let summary: ReportSummary | null = null
  let error: string | null = null

  try {
    summary = await getReportSummaryServer({ from, to })
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat laporan.")
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
      <AdminPageHeader
        title="Laporan"
        description="Ringkasan kunjungan dan performa antrian."
        icon={<FileText className="size-5" />}
      />

      {error || !summary ? (
        <Alert variant="destructive">
          <AlertTitle>Laporan tidak tersedia</AlertTitle>

          <AlertDescription>
            {error ?? "Terjadi kesalahan saat memuat laporan."}
          </AlertDescription>
        </Alert>
      ) : (
        <ReportSummaryView summary={summary} />
      )}
    </div>
  )
}
