import { redirect } from "next/navigation"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { ReceptionQueueWorkspace } from "@/components/receptionist/queue/reception-queue-workspace"

import { getApiErrorMessage } from "@/lib/api/error"
import { getActiveDepartmentsServer } from "@/lib/api/reception-server"
import { getSession } from "@/lib/auth/session"
import { resolveDepartmentId } from "@/lib/reception/department"

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

  let departments: Department[] = []
  let loadError: string | null = null

  try {
    departments = await getActiveDepartmentsServer()
  } catch (cause) {
    loadError = getApiErrorMessage(cause, "Gagal memuat daftar poli.")
  }

  if (loadError) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
        <Alert variant="destructive">
          <AlertTitle>Daftar poli tidak tersedia</AlertTitle>

          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const departmentId = resolveDepartmentId(
    params.department_id,
    session.user.department_id,
    departments
  )

  return (
    <ReceptionQueueWorkspace
      departmentId={departmentId}
      departments={departments}
      actorEmail={session.user.email}
    />
  )
}
