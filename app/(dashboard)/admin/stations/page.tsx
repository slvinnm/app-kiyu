import { MapPin } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { StationManager } from "@/components/admin/stations/station-manager"

import {
  getDepartmentOptionsServer,
  getStationsTableServer,
} from "@/lib/api/admin-server"
import { getApiErrorMessage } from "@/lib/api/error"
import { numberFilter, parseTableParams } from "@/lib/table-params"

import type { AdminStation } from "@/types/admin"
import type { Department, Paginated } from "@/types/reception"

const SORTABLE = [
  "code",
  "name",
  "type",
  "is_active",
  "department_id",
  "created_at",
]

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const { table, filters } = parseTableParams(params, {
    sortable: SORTABLE,
    defaultPerPage: 10,
    filters: ["department_id", "type"],
  })

  let stations: Paginated<AdminStation> | null = null
  let departments: Department[] = []
  let error: string | null = null

  try {
    ;[stations, departments] = await Promise.all([
      getStationsTableServer({
        ...table,
        department_id: numberFilter(filters.department_id),
        type: filters.type || undefined,
      }),
      getDepartmentOptionsServer(),
    ])
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat data station.")
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
      <AdminPageHeader
        title="Station"
        description="Kelola titik pelayanan, tipe, dan prefix nomor antrian."
        icon={<MapPin className="size-5" />}
      />

      {error || !stations ? (
        <Alert variant="destructive">
          <AlertTitle>Data station tidak tersedia</AlertTitle>

          <AlertDescription>
            {error ?? "Terjadi kesalahan saat memuat station."}
          </AlertDescription>
        </Alert>
      ) : (
        <StationManager
          rows={stations.data}
          total={stations.total}
          lastPage={stations.last_page}
          departments={departments}
          filters={filters}
          state={{
            search: table.search ?? "",
            page: table.page,
            perPage: table.per_page,
            sort: table.sort ?? "",
            direction: table.direction,
            filters,
            filterKeys: ["department_id", "type"],
          }}
        />
      )}
    </div>
  )
}
