import { ScrollText } from "lucide-react"

import { ConsolePageHeader } from "@/components/console/console-page-header"
import { AuditTable } from "@/components/facility/audit-logs/audit-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { getApiErrorMessage } from "@/lib/api/error"
import { getAuditLogsServer } from "@/lib/api/admin-server"
import { parseTableParams } from "@/lib/table-params"

import type { AuditLog, Paginated } from "@/types/admin"

const SORTABLE = ["action", "entity_type", "user_id", "created_at", "id"]

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const { table, filters } = parseTableParams(params, {
    sortable: SORTABLE,
    defaultPerPage: 25,
    filters: ["action", "entity_type", "user_id"],
  })

  let logs: Paginated<AuditLog> | null = null
  let error: string | null = null

  try {
    logs = await getAuditLogsServer({ ...table, ...filters })
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat audit log.")
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <ConsolePageHeader
        context="Organisasi"
        title="Audit Log"
        description="Aktivitas penting di seluruh fasilitas organisasi."
        icon={<ScrollText className="size-5" />}
      />

      {error || !logs ? (
        <Alert variant="destructive">
          <AlertTitle>Audit log tidak tersedia</AlertTitle>
          <AlertDescription>
            {error ?? "Terjadi kesalahan saat memuat audit log."}
          </AlertDescription>
        </Alert>
      ) : (
        <AuditTable
          rows={logs.data}
          total={logs.total}
          lastPage={logs.last_page}
          filters={filters}
          state={{
            search: table.search ?? "",
            page: table.page,
            perPage: table.per_page,
            sort: table.sort ?? "",
            direction: table.direction,
            filters,
          }}
        />
      )}
    </div>
  )
}
