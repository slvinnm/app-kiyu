import { CalendarClock } from "lucide-react"
import { redirect } from "next/navigation"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { VisitManager } from "@/components/admin/visits/visit-manager"

import {
  getDepartmentsServer,
  getVisitsServer,
} from "@/lib/api/admin-server"
import { getApiErrorMessage } from "@/lib/api/error"
import { getSession } from "@/lib/auth/session"

import type { Department, Paginated, Visit } from "@/types/reception"

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
  const rawDepartment = first(params.department_id)
  const rawPage = first(params.page)
  const parsedDepartment = rawDepartment ? Number(rawDepartment) : Number.NaN
  const parsedPage = rawPage ? Number(rawPage) : 1

  const filters = {
    department_id: Number.isInteger(parsedDepartment)
      ? parsedDepartment
      : undefined,
    status: first(params.status) || undefined,
    date: first(params.date) || undefined,
    page: Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1,
  }

  let visits: Paginated<Visit> | null = null
  let departments: Department[] = []
  let error: string | null = null

  try {
    ;[visits, departments] = await Promise.all([
      getVisitsServer({ ...filters, per_page: 20 }),
      getDepartmentsServer(),
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
          visits={visits.data}
          pagination={visits}
          departments={departments}
          filters={filters}
          actorEmail={session.user.email}
        />
      )}
    </div>
  )
}
