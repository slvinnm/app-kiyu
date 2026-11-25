import { ScrollText } from "lucide-react"

import { ConsolePageHeader } from "@/components/console/console-page-header"
import { SimpleTable } from "@/components/console/simple-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { getApiErrorMessage } from "@/lib/api/error"
import { getPlatformAuditLogsServer } from "@/lib/api/platform-server"
import { formatDateTime } from "@/lib/reception/format"

import type { PlatformAuditLog } from "@/types/platform"

function metadataText(metadata: unknown): string {
  if (metadata === null || metadata === undefined) {
    return "-"
  }

  try {
    const text = JSON.stringify(metadata)
    return text.length > 90 ? `${text.slice(0, 90)}…` : text
  } catch {
    return "-"
  }
}

export default async function Page() {
  let rows: PlatformAuditLog[] = []
  let error: string | null = null

  try {
    rows = (await getPlatformAuditLogsServer({ per_page: 50 })).data
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat audit log platform.")
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <ConsolePageHeader
        context="Platform"
        title="Platform Audit Log"
        description="Aktivitas operator platform: siklus hidup tenant, paket, dan support access."
        icon={<ScrollText className="size-5" />}
      />

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Audit log tidak tersedia</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <SimpleTable
          rows={rows}
          getRowKey={(row) => row.id}
          emptyMessage="Belum ada aktivitas platform."
          columns={[
            { header: "Waktu", cell: (row) => formatDateTime(row.created_at) },
            {
              header: "Aktor",
              cell: (row) => row.platform_user?.name ?? "-",
            },
            {
              header: "Aksi",
              cell: (row) => <span className="font-medium">{row.action}</span>,
            },
            { header: "Tenant", cell: (row) => row.tenant?.name ?? "-" },
            {
              header: "Metadata",
              cell: (row) => (
                <span className="text-xs text-muted-foreground">
                  {metadataText(row.metadata)}
                </span>
              ),
            },
          ]}
        />
      )}
    </div>
  )
}
