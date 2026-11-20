import { UserCog } from "lucide-react"
import { redirect } from "next/navigation"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { UserManager } from "@/components/admin/users/user-manager"

import {
  getDepartmentsServer,
  getStationsServer,
  getUsersServer,
} from "@/lib/api/admin-server"
import { getApiErrorMessage } from "@/lib/api/error"
import { getSession } from "@/lib/auth/session"

import type { AdminStation, AdminUser } from "@/types/admin"
import type { Department, Paginated } from "@/types/reception"

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await getSession()

  if (!session?.user?.role) {
    redirect("/login")
  }

  const params = await searchParams
  const search = first(params.search) ?? ""
  const role = first(params.role) ?? ""
  const rawPage = first(params.page)
  const parsedPage = rawPage ? Number(rawPage) : 1
  const page =
    Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1

  let users: Paginated<AdminUser> | null = null
  let departments: Department[] = []
  let stations: AdminStation[] = []
  let error: string | null = null

  try {
    ;[users, departments, stations] = await Promise.all([
      getUsersServer({
        search: search || undefined,
        role: role || undefined,
        page,
        per_page: 20,
      }),
      getDepartmentsServer(),
      getStationsServer(),
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
          users={users.data}
          pagination={users}
          departments={departments}
          stations={stations}
          filters={{
            search: search || undefined,
            role: role || undefined,
            page,
          }}
          currentUserId={session.user.id}
        />
      )}
    </div>
  )
}
