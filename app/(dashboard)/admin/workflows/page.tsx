import { GitBranch } from "lucide-react"
import { redirect } from "next/navigation"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { WorkflowManager } from "@/components/admin/workflows/workflow-manager"

import {
  getDepartmentsServer,
  getWorkflowsServer,
} from "@/lib/api/admin-server"
import { getApiErrorMessage } from "@/lib/api/error"
import { getSession } from "@/lib/auth/session"

import type { Workflow } from "@/types/admin"
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

  let workflows: Workflow[] = []
  let departments: Department[] = []
  let error: string | null = null

  try {
    ;[workflows, departments] = await Promise.all([
      getWorkflowsServer(),
      getDepartmentsServer(),
    ])
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat workflow.")
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
      <AdminPageHeader
        title="Workflow"
        description="Atur urutan pelayanan per poli dan langkah station-nya."
        icon={<GitBranch className="size-5" />}
      />

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Workflow tidak tersedia</AlertTitle>

          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <WorkflowManager
          workflows={workflows}
          departments={departments}
          defaultDepartmentId={defaultDepartmentId}
        />
      )}
    </div>
  )
}
