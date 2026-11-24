import { LifeBuoy } from "lucide-react"

import { ConsolePageHeader } from "@/components/console/console-page-header"
import { SimpleTable } from "@/components/console/simple-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

import { getApiErrorMessage } from "@/lib/api/error"
import { getSupportAccessesServer } from "@/lib/api/platform-server"
import { formatDateTime } from "@/lib/reception/format"

import type { SupportAccess } from "@/types/platform"

function isActive(access: SupportAccess): boolean {
  return access.ended_at === null && new Date(access.expires_at) > new Date()
}

export default async function Page() {
  let rows: SupportAccess[] = []
  let error: string | null = null

  try {
    rows = (await getSupportAccessesServer({ per_page: 100 })).data
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat riwayat support access.")
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <ConsolePageHeader
        context="Platform"
        title="Riwayat Support Access"
        description="Akses dukungan platform ke tenant, dengan alasan dan masa berlaku."
        icon={<LifeBuoy className="size-5" />}
      />

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Riwayat tidak tersedia</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <SimpleTable
          rows={rows}
          getRowKey={(row) => row.id}
          emptyMessage="Belum ada support access."
          columns={[
            { header: "Tenant", cell: (row) => row.tenant?.name ?? row.tenant_id },
            {
              header: "Operator",
              cell: (row) => row.platform_user?.name ?? "-",
            },
            { header: "Alasan", cell: (row) => row.reason },
            {
              header: "Status",
              cell: (row) => (
                <Badge variant={isActive(row) ? "secondary" : "outline"}>
                  {isActive(row) ? "Aktif" : "Berakhir"}
                </Badge>
              ),
            },
            {
              header: "Mulai",
              cell: (row) => formatDateTime(row.started_at),
            },
            {
              header: "Kedaluwarsa",
              cell: (row) => formatDateTime(row.expires_at),
            },
          ]}
        />
      )}
    </div>
  )
}
