import { FileText } from "lucide-react"

import { ConsolePageHeader } from "@/components/console/console-page-header"
import { ReportSummaryView } from "@/components/facility/reports/report-summary"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { getApiErrorMessage } from "@/lib/api/error"
import {
  getEntitlementsServer,
  getReportSummaryServer,
} from "@/lib/api/admin-server"

export default async function Page() {
  let summary = null
  let entitlements: Record<string, boolean | number> | null = null
  let error: string | null = null

  try {
    ;[summary, entitlements] = await Promise.all([
      getReportSummaryServer({}),
      getEntitlementsServer(),
    ])
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat ringkasan laporan.")
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <ConsolePageHeader
        context="Organisasi"
        title="Laporan"
        description="Ringkasan operasional antrean organisasi."
        icon={<FileText className="size-5" />}
      />

      {error || !summary ? (
        <Alert variant="destructive">
          <AlertTitle>Laporan tidak tersedia</AlertTitle>
          <AlertDescription>{error ?? "Terjadi kesalahan."}</AlertDescription>
        </Alert>
      ) : (
        <ReportSummaryView
          summary={summary}
          canExport={entitlements?.advanced_reports === true}
        />
      )}
    </div>
  )
}
