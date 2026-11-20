import { MapPin } from "lucide-react"
import { redirect } from "next/navigation"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { StationManager } from "@/components/admin/stations/station-manager"

import {
  getDepartmentsServer,
  getStationsServer,
} from "@/lib/api/admin-server"
import { getApiErrorMessage } from "@/lib/api/error"
import { getSession } from "@/lib/auth/session"

import type { AdminStation } from "@/types/admin"
import type { Department } from "@/types/reception"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ department_id?: string | string[] }>
}) {
  const session = await getSession()

  if (!session?.user?.role) {
    redirect("/login")
  }

  const params = await searchParams
  const rawDepartment = Array.isArray(params.department_id)
    ? params.department_id[0]
    : params.department_id
  const parsedDepartment = rawDepartment ? Number(rawDepartment) : Number.NaN
  const defaultDepartmentId = Number.isInteger(parsedDepartment)
    ? parsedDepartment
    : null

  let stations: AdminStation[] = []
  let departments: Department[] = []
  let error: string | null = null

  try {
    ;[stations, departments] = await Promise.all([
      getStationsServer(),
      getDepartmentsServer(),
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

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Data station tidak tersedia</AlertTitle>

          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <StationManager
          stations={stations}
          departments={departments}
          defaultDepartmentId={defaultDepartmentId}
        />
      )}
    </div>
  )
}
