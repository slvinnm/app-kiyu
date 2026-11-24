import { GitBranch } from "lucide-react"
import { redirect } from "next/navigation"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { WorkflowManager } from "@/components/admin/workflows/workflow-manager"

import {
  getDepartmentOptionsServer,
  getWorkflowsTableServer,
} from "@/lib/api/admin-server"
import { getApiErrorMessage } from "@/lib/api/error"
import { numberFilter, parseTableParams } from "@/lib/table-params"

import type { Workflow } from "@/types/admin"
import type { Department, Paginated } from "@/types/reception"

const SORTABLE = ["name", "is_active", "department_id", "created_at"]

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {

  const params = await searchParams
  const { table, filters } = parseTableParams(params, {
    sortable: SORTABLE,
    defaultPerPage: 10,
    filters: ["department_id"],
  })

  let workflows: Paginated<Workflow> | null = null
  let departments: Department[] = []
  let error: string | null = null

  try {
    ;[workflows, departments] = await Promise.all([
      getWorkflowsTableServer({
        ...table,
        department_id: numberFilter(filters.department_id),
      }),
      getDepartmentOptionsServer(),
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

      {error || !workflows ? (
        <Alert variant="destructive">
          <AlertTitle>Workflow tidak tersedia</AlertTitle>

          <AlertDescription>
            {error ?? "Terjadi kesalahan saat memuat workflow."}
          </AlertDescription>
        </Alert>
      ) : (
        <WorkflowManager
          rows={workflows.data}
          total={workflows.total}
          lastPage={workflows.last_page}
          departments={departments}
          filters={filters}
          state={{
            search: table.search ?? "",
            page: table.page,
            perPage: table.per_page,
            sort: table.sort ?? "",
            direction: table.direction,
            filters,
            filterKeys: ["department_id"],
          }}
        />
      )}
    </div>
  )
}
