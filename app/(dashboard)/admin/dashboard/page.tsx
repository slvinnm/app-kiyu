import Link from "next/link"
import { redirect } from "next/navigation"
import {
  Activity,
  Building2,
  CalendarClock,
  GitBranch,
  LayoutDashboardIcon,
  ListOrdered,
  MapPin,
  Users,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminStatCard } from "@/components/admin/admin-stat-card"

import {
  getAuditLogsServer,
  getDepartmentOptionsServer,
  getPatientStatisticsServer,
  getTicketStatisticsServer,
  getVisitStatisticsServer,
  getWorkflowStatisticsServer,
} from "@/lib/api/admin-server"
import type { CountStatistics } from "@/lib/api/admin-server"
import { todayJakarta } from "@/lib/admin/date"
import { getSession } from "@/lib/auth/session"
import { formatDateTime } from "@/lib/reception/format"

import type { AuditLog } from "@/types/admin"
import type { Department, Paginated } from "@/types/reception"

function metadataText(metadata: unknown): string {
  if (metadata === null || metadata === undefined) {
    return "-"
  }

  try {
    const text = JSON.stringify(metadata)

    return text.length > 90 ? `${text.slice(0, 90)}…` : text
  } catch {
    return "-"
  }
}

export default async function Page() {
  const session = await getSession()

  if (!session?.user?.role) {
    redirect("/login")
  }

  const results = await Promise.allSettled([
    getDepartmentOptionsServer(),
    getWorkflowStatisticsServer(),
    getPatientStatisticsServer(),
    getVisitStatisticsServer({ date: todayJakarta() }),
    getTicketStatisticsServer({ status: "CREATED" }),
    getTicketStatisticsServer({ status: "IN_PROGRESS" }),
    getAuditLogsServer({ per_page: 5 }),
  ])

  function value<T>(index: number): T | null {
    const result = results[index]

    return result.status === "fulfilled" ? (result.value as T) : null
  }

  const departments = value<Department[]>(0)
  const workflowCount = value<CountStatistics>(1)
  const patientCount = value<CountStatistics>(2)
  const visitsToday = value<CountStatistics>(3)
  const waiting = value<CountStatistics>(4)
  const inProgress = value<CountStatistics>(5)
  const auditLogs = value<Paginated<AuditLog>>(6)

  const failed = results.filter((result) => result.status === "rejected").length
  const stationCount =
    departments?.reduce(
      (total, department) => total + (department.stations_count ?? 0),
      0
    ) ?? null

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
      <AdminPageHeader
        title="Dasbor"
        description="Ringkasan konfigurasi organisasi dan operasional harian."
        icon={<LayoutDashboardIcon className="size-5" />}
      />

      {failed === results.length && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Data tidak dapat dimuat</AlertTitle>

          <AlertDescription>
            Backend tidak merespons. Muat ulang halaman atau periksa koneksi.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Poli"
          value={departments?.length ?? null}
          icon={<Building2 className="size-4" />}
          hint={`${departments?.filter((d) => d.is_active).length ?? 0} aktif`}
        />

        <AdminStatCard
          label="Station"
          value={stationCount}
          icon={<MapPin className="size-4" />}
        />

        <AdminStatCard
          label="Workflow"
          value={workflowCount?.total ?? null}
          icon={<GitBranch className="size-4" />}
        />

        <AdminStatCard
          label="Pasien"
          value={patientCount?.total ?? null}
          icon={<Users className="size-4" />}
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <AdminStatCard
          label="Kunjungan Hari Ini"
          value={visitsToday?.total ?? null}
          icon={<CalendarClock className="size-4" />}
          hint={todayJakarta()}
        />

        <AdminStatCard
          label="Antrian Menunggu"
          value={waiting?.total ?? null}
          icon={<ListOrdered className="size-4" />}
        />

        <AdminStatCard
          label="Sedang Dilayani"
          value={inProgress?.total ?? null}
          icon={<Activity className="size-4" />}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Audit Terbaru</CardTitle>

                <CardDescription>
                  Aktivitas administrasi terakhir.
                </CardDescription>
              </div>

              <Link
                href="/admin/audit-logs"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Semua
              </Link>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {auditLogs && auditLogs.data.length > 0 ? (
              <div>
                {auditLogs.data.map((log) => (
                  <div key={log.id} className="border-t p-4 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{log.action}</p>

                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(log.created_at)}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {log.entity_type} #{log.entity_id ?? "-"} ·{" "}
                      {log.user_id ?? "sistem"}
                    </p>

                    <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">
                      {metadataText(log.metadata)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Belum ada audit log.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Poli & Station</CardTitle>

                <CardDescription>
                  Struktur organisasi yang terdaftar.
                </CardDescription>
              </div>

              <Link
                href="/admin/departments"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Kelola
              </Link>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {departments && departments.length > 0 ? (
              <div>
                {departments.map((department) => (
                  <div
                    key={department.id}
                    className="flex items-center justify-between gap-3 border-t p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {department.name}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {department.code} · {department.stations_count ?? 0}{" "}
                        station
                      </p>
                    </div>

                    <Badge
                      variant={department.is_active ? "default" : "outline"}
                    >
                      {department.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Belum ada poli.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Aksi Cepat</CardTitle>
        </CardHeader>

        <CardContent className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/departments"
            className={buttonVariants({ variant: "outline" })}
          >
            <Building2 />
            Poli
          </Link>

          <Link
            href="/admin/stations"
            className={buttonVariants({ variant: "outline" })}
          >
            <MapPin />
            Station
          </Link>

          <Link
            href="/admin/workflows"
            className={buttonVariants({ variant: "outline" })}
          >
            <GitBranch />
            Workflow
          </Link>

          <Link
            href="/admin/visits"
            className={buttonVariants({ variant: "outline" })}
          >
            <CalendarClock />
            Kunjungan
          </Link>

          <Link
            href="/admin/clients"
            className={buttonVariants({ variant: "outline" })}
          >
            <Users />
            Pasien
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
