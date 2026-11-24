import { Building2 } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { DepartmentManager } from "@/components/admin/departments/department-manager"

import { getDepartmentsTableServer } from "@/lib/api/admin-server"
import { getApiErrorMessage } from "@/lib/api/error"
import { parseTableParams } from "@/lib/table-params"

import type { Department, Paginated } from "@/types/reception"

const SORTABLE = ["code", "name", "is_active", "created_at"]

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const { table, filters } = parseTableParams(params, {
    sortable: SORTABLE,
    defaultPerPage: 10,
  })

  let departments: Paginated<Department> | null = null
  let error: string | null = null

  try {
    departments = await getDepartmentsTableServer({ ...table })
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat daftar departemen.")
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
      <AdminPageHeader
        title="Departemen"
        description="Kelola unit layanan yang menjadi tujuan antrean pelanggan."
        icon={<Building2 className="size-5" />}
      />

      {error || !departments ? (
        <Alert variant="destructive">
          <AlertTitle>Daftar departemen tidak tersedia</AlertTitle>

          <AlertDescription>
            {error ?? "Terjadi kesalahan saat memuat departemen."}
          </AlertDescription>
        </Alert>
      ) : (
        <DepartmentManager
          rows={departments.data}
          total={departments.total}
          lastPage={departments.last_page}
          filters={filters}
          state={{
            search: table.search ?? "",
            page: table.page,
            perPage: table.per_page,
            sort: table.sort ?? "",
            direction: table.direction,
            filters,
            filterKeys: [],
          }}
        />
      )}
    </div>
  )
}
