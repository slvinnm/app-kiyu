import { GitBranch } from "lucide-react"
import { notFound } from "next/navigation"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { WorkflowDetail } from "@/components/admin/workflows/workflow-detail"

import {
  getStationOptionsServer,
  getWorkflowServer,
} from "@/lib/api/admin-server"
import { ApiError, getApiErrorMessage } from "@/lib/api/error"

import type { AdminStation, Workflow } from "@/types/admin"

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workflowId = Number(id)

  if (!Number.isInteger(workflowId)) {
    notFound()
  }

  let workflow: Workflow | null = null
  let error: string | null = null

  try {
    workflow = await getWorkflowServer(workflowId)
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 404) {
      notFound()
    }

    error = getApiErrorMessage(cause, "Gagal memuat workflow.")
  }

  if (!workflow) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
        <AdminPageHeader
          title="Workflow"
          description="Detail workflow tidak dapat dimuat."
          icon={<GitBranch className="size-5" />}
        />

        <Alert variant="destructive">
          <AlertTitle>Workflow tidak tersedia</AlertTitle>

          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  let stations: AdminStation[] = []

  try {
    stations = await getStationOptionsServer({
      department_id: workflow.department_id,
    })
  } catch {
    stations = []
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
      <div className="mb-3 flex items-center gap-2">
        <Badge variant="outline">{workflow.department?.code ?? "Poli"}</Badge>

        <Badge variant={workflow.is_active ? "default" : "outline"}>
          {workflow.is_active ? "Aktif" : "Nonaktif"}
        </Badge>
      </div>

      <AdminPageHeader
        title={workflow.name}
        description={`Kelola langkah workflow untuk ${
          workflow.department?.name ?? "poli ini"
        }.`}
        icon={<GitBranch className="size-5" />}
      />

      <WorkflowDetail workflow={workflow} stations={stations} />
    </div>
  )
}
