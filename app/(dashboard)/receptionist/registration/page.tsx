import { ClipboardPlusIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { ManualIntakeForm } from "@/components/receptionist/registration/manual-intake-form"

import { getApiErrorMessage } from "@/lib/api/error"
import {
  getDepartmentOptionsServer,
  getStationOptionsServer,
} from "@/lib/api/reception-server"
import { requireRole } from "@/lib/auth/guard"
import { resolveDepartmentId } from "@/lib/reception/department"

import type { Department, Station } from "@/types/reception"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ department_id?: string | string[] }>
}) {
  const user = await requireRole(["tenant_admin", "facility_admin", "operator"])

  const params = await searchParams

  let departments: Department[] = []
  let stations: Station[] = []
  let loadError: string | null = null

  try {
    ;[departments, stations] = await Promise.all([
      getDepartmentOptionsServer(),
      getStationOptionsServer().catch(() => []),
    ])
  } catch (cause) {
    loadError = getApiErrorMessage(cause, "Gagal memuat daftar departemen.")
  }

  const departmentId = resolveDepartmentId(
    params.department_id,
    stations,
    user.station_id,
    departments
  )

  return (
    <div className="mx-auto w-full p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Reception</Badge>

          <span className="text-xs text-muted-foreground">Customer Intake</span>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ClipboardPlusIcon className="size-5" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Registrasi
            </h1>

            <p className="text-sm text-muted-foreground">
              Buat intake manual walk-in. Data pelanggan dilengkapi saat registrasi
              di meja reception.
            </p>
          </div>
        </div>
      </div>

      {loadError ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Daftar departemen tidak tersedia
            </CardTitle>

            <CardDescription>{loadError}</CardDescription>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-muted-foreground">
              Muat ulang halaman atau hubungi administrator jika masalah
              berlanjut.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ManualIntakeForm
          departments={departments}
          defaultDepartmentId={departmentId}
          actorEmail={user.email}
        />
      )}
    </div>
  )
}
