import Link from "next/link"
import {
  ArrowLeftIcon,
  Building2,
  GitBranch,
  MapPin,
  UserCog,
} from "lucide-react"

import { ConsolePageHeader } from "@/components/console/console-page-header"
import { StationManager } from "@/components/facility/stations/station-manager"
import { WorkflowDetail } from "@/components/facility/departments/workflows/workflow-detail"
import { WorkflowManager } from "@/components/facility/departments/workflows/workflow-manager"
import { UserManager } from "@/components/facility/users/user-manager"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "cn"

import {
  getDepartmentDetailInFacilityServer,
  getDepartmentOptionsInFacilityServer,
  getStationsInFacilityServer,
  getUsersInFacilityServer,
  getWorkflowDetailInFacilityServer,
  getWorkflowsInFacilityServer,
} from "@/lib/api/admin-server"
import { getApiErrorMessage } from "@/lib/api/error"
import { getVerifiedUser } from "@/lib/auth/guard"
import { parseTableParams } from "@/lib/table-params"

import type { AdminStation, AdminUser } from "@/types/admin"
import type { Department, Paginated, Workflow } from "@/types/reception"

const SORTABLE_STATIONS = ["code", "name", "type", "is_active", "created_at"]
const SORTABLE_WORKFLOWS = ["name", "is_active", "created_at"]
const SORTABLE_USERS = ["name", "email", "role", "created_at", "id"]

const TABS = [
  { key: "loket", label: "Loket", icon: <MapPin className="size-3.5" /> },
  {
    key: "alur",
    label: "Alur Layanan",
    icon: <GitBranch className="size-3.5" />,
  },
  {
    key: "pengguna",
    label: "Pengguna",
    icon: <UserCog className="size-3.5" />,
  },
] as const

type TabKey = (typeof TABS)[number]["key"]

function resolveTab(value: unknown): TabKey {
  return value === "alur" || value === "pengguna" ? value : "loket"
}

/**
 * Department detail nested under a Facility in the Portal (PRD §8.2).
 *
 * URL: `/portal/facilities/[id]/detail/departments/[departmentId]/detail`.
 * Loket, Alur Layanan and Pengguna are tabs, mirroring the facility workspace.
 */
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; departmentId: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id, departmentId } = await params
  const facilityId = Number(id)
  const deptId = Number(departmentId)
  const rawParams = await searchParams
  const activeTab = resolveTab(rawParams.tab)
  const selectedWorkflowId =
    typeof rawParams.workflow === "string" && rawParams.workflow !== ""
      ? Number(rawParams.workflow)
      : null

  let department: Department | null = null
  let error: string | null = null

  try {
    department = await getDepartmentDetailInFacilityServer(facilityId, deptId)
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat detail departemen.")
  }

  const backHref = `/portal/facilities/${facilityId}/detail`

  let stations: Paginated<AdminStation> | null = null
  let workflows: Paginated<Workflow> | null = null
  let selectedWorkflow: Workflow | null = null
  let workflowStations: AdminStation[] = []
  let users: Paginated<AdminUser> | null = null
  let userOptions: {
    departments: Department[]
    stations: AdminStation[]
  } | null = null
  let currentUserId = 0
  let tabError: string | null = null

  const sortable =
    activeTab === "loket"
      ? SORTABLE_STATIONS
      : activeTab === "alur"
        ? SORTABLE_WORKFLOWS
        : SORTABLE_USERS

  const { table } = parseTableParams(rawParams, {
    sortable,
    defaultPerPage: 10,
  })

  if (department) {
    try {
      if (activeTab === "loket") {
        stations = await getStationsInFacilityServer(facilityId, {
          ...table,
          department_id: deptId,
        })
      } else if (activeTab === "alur") {
        if (selectedWorkflowId !== null) {
          const detail = await getWorkflowDetailInFacilityServer(
            facilityId,
            selectedWorkflowId
          )

          // Only render a workflow that belongs to this department.
          selectedWorkflow = detail.department_id === deptId ? detail : null

          if (selectedWorkflow !== null) {
            const stationRows = await getStationsInFacilityServer(facilityId, {
              department_id: deptId,
            })
            workflowStations = stationRows.data
          }
        } else {
          workflows = await getWorkflowsInFacilityServer(facilityId, {
            ...table,
            department_id: deptId,
          })
        }
      } else {
        const [userRows, viewer, depts, stationRows] = await Promise.all([
          getUsersInFacilityServer(facilityId, {
            ...table,
            department_id: deptId,
          }),
          getVerifiedUser(),
          getDepartmentOptionsInFacilityServer(facilityId),
          getStationsInFacilityServer(facilityId, { department_id: deptId }),
        ])

        users = userRows
        currentUserId = viewer?.id ?? 0
        userOptions = { departments: depts, stations: stationRows.data }
      }
    } catch (cause) {
      tabError = getApiErrorMessage(cause, "Gagal memuat data departemen.")
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
      <ConsolePageHeader
        context="Organisasi"
        title={department?.name ?? "Departemen"}
        description={
          department
            ? `${department.code} · ${department.stations?.length ?? 0} loket · ${
                department.workflows?.length ?? 0
              } alur layanan`
            : (error ?? "Detail departemen")
        }
        icon={<Building2 className="size-5" />}
        actions={
          <>
            {department && (
              <Badge variant={department.is_active ? "default" : "outline"}>
                {department.is_active ? "Aktif" : "Nonaktif"}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={backHref} />}
            >
              <ArrowLeftIcon data-icon="inline-start" />
              Kembali
            </Button>
          </>
        }
      />

      {error ? (
        <Alert variant="destructive" className="mt-6">
          <AlertTitle>Detail departemen tidak tersedia</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <>
          <nav className="mt-6 flex items-center gap-1 border-b">
            {TABS.map((tab) => {
              const isActive = tab.key === activeTab

              return (
                <Link
                  key={tab.key}
                  href={`/portal/facilities/${facilityId}/detail/departments/${deptId}/detail?tab=${tab.key}`}
                  className={cn(
                    "flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </Link>
              )
            })}
          </nav>

          <div className="mt-6">
            {tabError ? (
              <Alert variant="destructive">
                <AlertTitle>Data tidak tersedia</AlertTitle>
                <AlertDescription>{tabError}</AlertDescription>
              </Alert>
            ) : activeTab === "loket" && stations ? (
              <StationManager
                rows={stations.data}
                total={stations.total}
                lastPage={stations.last_page}
                filters={{}}
                departments={department ? [department] : []}
                scopedDepartment
                state={{
                  search: table.search ?? "",
                  page: table.page,
                  perPage: table.per_page,
                  sort: table.sort ?? "",
                  direction: table.direction,
                  filters: { department_id: String(deptId) },
                  filterKeys: [],
                }}
              />
            ) : activeTab === "alur" && selectedWorkflow ? (
              <WorkflowDetail
                workflow={selectedWorkflow}
                stations={workflowStations}
              />
            ) : activeTab === "alur" && workflows ? (
              <WorkflowManager
                rows={workflows.data}
                total={workflows.total}
                lastPage={workflows.last_page}
                filters={{}}
                departments={department ? [department] : []}
                scopedDepartment
                state={{
                  search: table.search ?? "",
                  page: table.page,
                  perPage: table.per_page,
                  sort: table.sort ?? "",
                  direction: table.direction,
                  filters: { department_id: String(deptId) },
                  filterKeys: [],
                }}
              />
            ) : activeTab === "pengguna" && users && userOptions ? (
              <UserManager
                rows={users.data}
                total={users.total}
                lastPage={users.last_page}
                filters={{}}
                departments={userOptions.departments}
                stations={userOptions.stations}
                currentUserId={currentUserId}
                scopedDepartmentId={deptId}
                state={{
                  search: table.search ?? "",
                  page: table.page,
                  perPage: table.per_page,
                  sort: table.sort ?? "",
                  direction: table.direction,
                  filters: { department_id: String(deptId) },
                  filterKeys: [],
                }}
              />
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}
