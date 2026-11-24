import { ScrollText } from "lucide-react"
import { redirect } from "next/navigation"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AuditTable } from "@/components/admin/audit-logs/audit-table"

import { getAuditLogsServer } from "@/lib/api/admin-server"
import { getApiErrorMessage } from "@/lib/api/error"
import { parseTableParams } from "@/lib/table-params"

import type { AuditLog } from "@/types/admin"
import type { Paginated } from "@/types/reception"

const SORTABLE = ["action", "entity_type", "user_id", "created_at", "id"]

const FILTER_KEYS = ["action", "entity_type", "user_id"]

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {

  const params = await searchParams
  const { table, filters } = parseTableParams(params, {
    sortable: SORTABLE,
    defaultPerPage: 10,
    filters: FILTER_KEYS,
  })

  let logs: Paginated<AuditLog> | null = null
  let error: string | null = null

  try {
    logs = await getAuditLogsServer({ ...table, ...filters })
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat audit log.")
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
      <AdminPageHeader
        title="Audit Log"
        description="Riwayat perubahan bisnis dan administratif yang sensitif."
        icon={<ScrollText className="size-5" />}
      />

      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-base">Aktivitas Sistem</CardTitle>

            <CardDescription>
              Filter berdasarkan action, tipe entitas, atau user.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {error || !logs ? (
            <div className="p-6">
              <Alert variant="destructive">
                <AlertTitle>Audit log tidak tersedia</AlertTitle>

                <AlertDescription>
                  {error ?? "Terjadi kesalahan saat memuat audit log."}
                </AlertDescription>
              </Alert>
            </div>
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
                filterKeys: FILTER_KEYS,
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
