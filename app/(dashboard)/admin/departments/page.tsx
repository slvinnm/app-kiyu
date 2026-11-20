import { Building2 } from "lucide-react"
import { redirect } from "next/navigation"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { DepartmentManager } from "@/components/admin/departments/department-manager"

import { getDepartmentsServer } from "@/lib/api/admin-server"
import { getApiErrorMessage } from "@/lib/api/error"
import { getSession } from "@/lib/auth/session"

import type { Department } from "@/types/reception"

export default async function Page() {
  const session = await getSession()

  if (!session?.user?.role) {
    redirect("/login")
  }

  let departments: Department[] = []
  let error: string | null = null

  try {
    departments = await getDepartmentsServer()
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat daftar poli.")
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
      <AdminPageHeader
        title="Poli"
        description="Kelola unit pelayanan yang menjadi tujuan kunjungan pasien."
        icon={<Building2 className="size-5" />}
      />

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Daftar poli tidak tersedia</AlertTitle>

          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <DepartmentManager departments={departments} />
      )}
    </div>
  )
}
