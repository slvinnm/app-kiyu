import Link from "next/link"
import { redirect } from "next/navigation"
import {
  ArrowRightIcon,
  ClipboardPlusIcon,
  SearchIcon,
  TicketIcon,
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

import { DepartmentSwitcher } from "@/components/receptionist/department-switcher"
import { QueueStatCards } from "@/components/receptionist/queue/queue-stat-cards"

import { getApiErrorMessage, getApiErrorType } from "@/lib/api/error"
import {
  getAllDepartmentsServer,
  getPatientCountServer,
  getReceptionQueueServer,
} from "@/lib/api/reception-server"
import { getSession } from "@/lib/auth/session"
import { resolveDepartmentId } from "@/lib/reception/department"
import {
  channelLabel,
  formatTime,
  priorityLabel,
} from "@/lib/reception/format"

import type { Department, ReceptionQueueSnapshot } from "@/types/reception"

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
  let departmentsError: string | null = null

  try {
    departments = await getAllDepartmentsServer()
  } catch (cause) {
    departmentsError = getApiErrorMessage(cause, "Gagal memuat daftar poli.")
  }

  const departmentId = resolveDepartmentId(
    params.department_id,
    session.user.department_id,
    departments
  )

  let snapshot: ReceptionQueueSnapshot | null = null
  let queueError: string | null = null
  let invalidWorkflow = false

  if (departmentId !== null) {
    try {
      snapshot = await getReceptionQueueServer(departmentId)
    } catch (cause) {
      queueError = getApiErrorMessage(cause, "Gagal memuat antrian.")
      invalidWorkflow = getApiErrorType(cause) === "INVALID_WORKFLOW"
    }
  }

  let patientCount: number | null = null

  try {
    patientCount = await getPatientCountServer()
  } catch {
    patientCount = null
  }

  const selectedDepartment =
    departments.find((department) => department.id === departmentId) ?? null

  const queueHref =
    departmentId !== null
      ? `/receptionist/queue?department_id=${departmentId}`
      : "/receptionist/queue"

  const registrationHref =
    departmentId !== null
      ? `/receptionist/registration?department_id=${departmentId}`
      : "/receptionist/registration"

  const waitingPreview = snapshot?.waiting.slice(0, 5) ?? []

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Reception</Badge>

            <span className="text-xs text-muted-foreground">
              {snapshot?.station.name ??
                selectedDepartment?.name ??
                "Meja registrasi"}
            </span>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ClipboardPlusIcon className="size-5" />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Dasbor</h1>

              <p className="text-sm text-muted-foreground">
                Ringkasan antrian registrasi dan akses cepat meja reception.
              </p>
            </div>
          </div>
        </div>

        <DepartmentSwitcher
          departments={departments}
          value={departmentId}
        />
      </div>

      {departmentsError && (
        <Alert variant="destructive" className="mt-6">
          <AlertTitle>Daftar poli tidak tersedia</AlertTitle>

          <AlertDescription>{departmentsError}</AlertDescription>
        </Alert>
      )}

      {!departmentsError && departmentId === null && (
        <Card className="mt-6">
          <CardContent className="flex min-h-52 flex-col items-center justify-center gap-4 text-center">
            <div>
              <CardTitle>Pilih poli terlebih dahulu</CardTitle>

              <CardDescription className="mt-2">
                Dasbor reception ditampilkan per poli. Pilih poli tempat Anda
                bertugas.
              </CardDescription>
            </div>

            <DepartmentSwitcher
              departments={departments}
              value={departmentId}
            />
          </CardContent>
        </Card>
      )}

      {invalidWorkflow && (
        <Alert variant="destructive" className="mt-6">
          <AlertTitle>Poli belum siap menerima antrian</AlertTitle>

          <AlertDescription>
            {queueError ??
              "Poli ini belum memiliki workflow registrasi aktif. Pilih poli lain atau hubungi administrator."}
          </AlertDescription>
        </Alert>
      )}

      {snapshot && (
        <div className="mt-6 space-y-5">
          <QueueStatCards
            waitingCount={snapshot.waiting_count}
            currentCalling={snapshot.current_calling !== null}
            calledToday={snapshot.called_count_today}
            onHoldCount={snapshot.on_hold.length}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">
                      Antrian Saat Ini
                    </CardTitle>

                    <CardDescription>
                      Pasien yang sedang dipanggil ke meja registrasi.
                    </CardDescription>
                  </div>

                  <Badge variant="outline">
                    {snapshot.current_calling ? "Dipanggil" : "Kosong"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                {snapshot.current_calling ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border p-6 text-center">
                      <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                        Nomor Antrian
                      </p>

                      <p className="mt-2 text-5xl font-black tracking-tight tabular-nums">
                        {snapshot.current_calling.queue_number}
                      </p>

                      <p className="mt-3 text-sm font-medium">
                        {snapshot.current_calling.visit?.patient?.name ??
                          "Walk-in — belum teridentifikasi"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        {snapshot.current_calling.workflow_step?.name ?? "-"}
                      </span>

                      <span>
                        {snapshot.current_calling.visit
                          ? channelLabel(
                              snapshot.current_calling.visit.intake_channel
                            )
                          : "-"}
                      </span>

                      <span>
                        Dipanggil{" "}
                        {formatTime(snapshot.current_calling.called_at)}
                      </span>
                    </div>

                    <Link
                      href={queueHref}
                      className={buttonVariants({ variant: "outline" })}
                    >
                      Buka Antrian
                      <ArrowRightIcon />
                    </Link>
                  </div>
                ) : (
                  <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-center">
                    <p className="text-sm font-medium">
                      Belum ada antrian dipanggil
                    </p>

                    <Link href={queueHref} className={buttonVariants()}>
                      Buka Antrian
                      <ArrowRightIcon />
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">Menunggu</CardTitle>

                    <CardDescription>
                      Antrian berikutnya di meja registrasi.
                    </CardDescription>
                  </div>

                  <Badge variant="outline">{snapshot.waiting_count}</Badge>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {waitingPreview.length > 0 ? (
                  <div>
                    {waitingPreview.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="flex items-start gap-3 border-t p-4"
                      >
                        <span className="font-semibold">
                          {ticket.queue_number}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">
                            {ticket.visit?.patient?.name ??
                              "Walk-in — belum teridentifikasi"}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {ticket.visit?.visit_number ?? "-"}
                          </p>
                        </div>

                        {ticket.priority !== 1 && (
                          <Badge variant="outline" className="text-[10px]">
                            {priorityLabel(ticket.priority)}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-sm font-medium">
                      Tidak ada antrian menunggu
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Antrian baru akan muncul di sini.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aksi Cepat</CardTitle>
            </CardHeader>

            <CardContent className="flex flex-wrap items-center gap-2">
              <Link
                href={registrationHref}
                className={buttonVariants({ variant: "outline" })}
              >
                <ClipboardPlusIcon />
                Intake Manual
              </Link>

              <Link
                href={queueHref}
                className={buttonVariants({ variant: "outline" })}
              >
                <TicketIcon />
                Buka Antrian
              </Link>

              <Link
                href="/receptionist/patients"
                className={buttonVariants({ variant: "outline" })}
              >
                <SearchIcon />
                Cari Pasien
              </Link>

              {patientCount !== null && (
                <span className="self-center text-xs text-muted-foreground">
                  Total pasien terdaftar: {patientCount}
                </span>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {!invalidWorkflow && queueError && (
        <Alert className="mt-6">
          <AlertTitle>Antrian tidak dapat dimuat</AlertTitle>

          <AlertDescription>{queueError}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
