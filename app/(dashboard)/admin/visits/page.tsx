import { CalendarClock } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { VisitManager } from "@/components/admin/visits/visit-manager"

import {
  getDepartmentOptionsServer,
  getVisitsServer,
} from "@/lib/api/admin-server"
import { getApiErrorMessage } from "@/lib/api/error"
import { requireRole } from "@/lib/auth/guard"
import { numberFilter, parseTableParams } from "@/lib/table-params"

import type { Department, Paginated, Visit } from "@/types/reception"

const SORTABLE = [
  "visit_number",
  "status",
  "priority",
  "intake_channel",
  "created_at",
  "id",
]

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const user = await requireRole(["tenant_admin", "facility_admin"])

  const params = await searchParams
  const { table, filters } = parseTableParams(params, {
    sortable: SORTABLE,
    defaultPerPage: 10,
    filters: ["department_id", "status", "date"],
  })

  let visits: Paginated<Visit> | null = null
  let departments: Department[] = []
  let error: string | null = null

  try {
    ;[visits, departments] = await Promise.all([
      getVisitsServer({
        ...table,
        department_id: numberFilter(filters.department_id),
        status: filters.status,
        date: filters.date,
      }),
      getDepartmentOptionsServer(),
    ])
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat kunjungan.")
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
      <AdminPageHeader
        title="Kunjungan"
        description="Monitoring kunjungan, prioritas, dan pembatalan administratif."
        icon={<CalendarClock className="size-5" />}
      />

      {error || !visits ? (
        <Alert variant="destructive">
          <AlertTitle>Data kunjungan tidak tersedia</AlertTitle>

          <AlertDescription>
            {error ?? "Terjadi kesalahan saat memuat kunjungan."}
          </AlertDescription>
        </Alert>
      ) : (
        <VisitManager
          rows={visits.data}
          total={visits.total}
          lastPage={visits.last_page}
          filters={filters}
          state={{
            search: table.search ?? "",
            page: table.page,
            perPage: table.per_page,
            sort: table.sort ?? "",
            direction: table.direction,
            filters,
            filterKeys: ["department_id", "status", "date"],
          }}
          departments={departments}
          actorEmail={user.email}
        />
      )}
    </div>
  )
}
