import Link from "next/link"
import { notFound } from "next/navigation"
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
  getDepartmentDetailServer,
  getDepartmentOptionsServer,
  getStationOptionsServer,
  getStationsTableServer,
  getUsersServer,
  getWorkflowDetailServer,
  getWorkflowsTableServer,
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
 * Department detail inside the Facility workspace (PRD §8.3).
 *
 * Loket, Alur Layanan and Pengguna are tabs of this page, not sidebar menus.
 * Their context is the department id in the URL:
 * `/facility/departments/[id]/detail?tab=loket|alur|pengguna`.
 */
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const departmentId = Number(id)
  const rawParams = await searchParams
  const activeTab = resolveTab(rawParams.tab)
  const selectedWorkflowId =
    typeof rawParams.workflow === "string" && rawParams.workflow !== ""
      ? Number(rawParams.workflow)
      : null

  let department: Department | null = null
  let error: string | null = null

  try {
    department = await getDepartmentDetailServer(departmentId)
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat detail departemen.")
  }

  if (error || !department) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
        <ConsolePageHeader
          context="Fasilitas"
          title="Departemen"
          description={error ?? "Departemen tidak ditemukan."}
          icon={<Building2 className="size-5" />}
          actions={
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/facility/departments" />}
            >
              <ArrowLeftIcon data-icon="inline-start" />
              Kembali
            </Button>
          }
        />

        {error === null && notFound()}
      </div>
    )
  }

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

  try {
    if (activeTab === "loket") {
      stations = await getStationsTableServer({
        ...table,
        department_id: departmentId,
      })
    } else if (activeTab === "alur") {
      if (selectedWorkflowId !== null) {
        // Render one workflow's steps inline (PRD §8.2). The list is not
        // needed in this view, so only the detail is fetched.
        selectedWorkflow = await getWorkflowDetailServer(selectedWorkflowId)

        if (selectedWorkflow.department_id !== departmentId) {
          selectedWorkflow = null
        }
      } else {
        workflows = await getWorkflowsTableServer({
          ...table,
          department_id: departmentId,
        })
      }

      if (selectedWorkflow !== null) {
        workflowStations = await getStationOptionsServer({
          department_id: departmentId,
        })
      }
    } else {
      const [userRows, viewer, depts, stationRows] = await Promise.all([
        getUsersServer({ ...table, department_id: departmentId }),
        getVerifiedUser(),
        getDepartmentOptionsServer(),
        getStationOptionsServer({ department_id: departmentId }),
      ])

      users = userRows
      currentUserId = viewer?.id ?? 0
      userOptions = { departments: depts, stations: stationRows }
    }
  } catch (cause) {
    tabError = getApiErrorMessage(cause, "Gagal memuat data departemen.")
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
      <ConsolePageHeader
        context="Fasilitas"
        title={department.name}
        description={`${department.code} · ${
          department.stations?.length ?? 0
        } loket · ${department.workflows?.length ?? 0} alur layanan`}
        icon={<Building2 className="size-5" />}
        actions={
          <Badge variant={department.is_active ? "default" : "outline"}>
            {department.is_active ? "Aktif" : "Nonaktif"}
          </Badge>
        }
      />

      <nav className="mt-6 flex items-center gap-1 border-b">
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab

          return (
            <Link
              key={tab.key}
              href={`/facility/departments/${departmentId}/detail?tab=${tab.key}`}
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
            departments={[department]}
            scopedDepartment
            state={{
              search: table.search ?? "",
              page: table.page,
              perPage: table.per_page,
              sort: table.sort ?? "",
              direction: table.direction,
              filters: { department_id: String(departmentId) },
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
            departments={[department]}
            scopedDepartment
            state={{
              search: table.search ?? "",
              page: table.page,
              perPage: table.per_page,
              sort: table.sort ?? "",
              direction: table.direction,
              filters: { department_id: String(departmentId) },
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
            scopedDepartmentId={departmentId}
            state={{
              search: table.search ?? "",
              page: table.page,
              perPage: table.per_page,
              sort: table.sort ?? "",
              direction: table.direction,
              filters: { department_id: String(departmentId) },
              filterKeys: [],
            }}
          />
        ) : null}
      </div>
    </div>
  )
}
