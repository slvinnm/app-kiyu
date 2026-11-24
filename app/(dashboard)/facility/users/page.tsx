import { UserCog } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { AdminPageHeader } from "@/components/facility/admin-page-header"
import { UserManager } from "@/components/facility/users/user-manager"

import {
  getDepartmentOptionsServer,
  getStationOptionsServer,
  getUsersServer,
} from "@/lib/api/admin-server"
import { getApiErrorMessage } from "@/lib/api/error"
import { requireRole } from "@/lib/auth/guard"
import { parseTableParams } from "@/lib/table-params"

import type { AdminStation, AdminUser } from "@/types/admin"
import type { Department, Paginated } from "@/types/reception"

const SORTABLE = ["name", "email", "role", "created_at", "id"]

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const user = await requireRole(["facility_admin"])

  const params = await searchParams
  const { table, filters } = parseTableParams(params, {
    sortable: SORTABLE,
    defaultPerPage: 10,
    filters: ["role"],
  })

  let users: Paginated<AdminUser> | null = null
  let departments: Department[] = []
  let stations: AdminStation[] = []
  let error: string | null = null

  try {
    ;[users, departments, stations] = await Promise.all([
      getUsersServer({ ...table, ...filters }),
      getDepartmentOptionsServer(),
      getStationOptionsServer(),
    ])
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat pengguna.")
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
      <AdminPageHeader
        title="Staff"
        description="Kelola akun staff, role, department, dan station kerja."
        icon={<UserCog className="size-5" />}
      />

      {error || !users ? (
        <Alert variant="destructive">
          <AlertTitle>Data pengguna tidak tersedia</AlertTitle>

          <AlertDescription>
            {error ?? "Terjadi kesalahan saat memuat pengguna."}
          </AlertDescription>
        </Alert>
      ) : (
        <UserManager
          rows={users.data}
          total={users.total}
          lastPage={users.last_page}
          filters={filters}
          state={{
            search: table.search ?? "",
            page: table.page,
            perPage: table.per_page,
            sort: table.sort ?? "",
            direction: table.direction,
            filters,
            filterKeys: ["role"],
          }}
          departments={departments}
          stations={stations}
          currentUserId={user.id}
        />
      )}
    </div>
  )
}
