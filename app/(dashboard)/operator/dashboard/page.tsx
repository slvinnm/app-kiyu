import Link from "next/link"
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

import { QueueStatCards } from "@/components/operator/queue/queue-stat-cards"
import { LiveRefresh } from "@/components/realtime/live-refresh"

import { getApiErrorMessage, getApiErrorType } from "@/lib/api/error"
import {
  getCustomerCountServer,
  getReceptionQueueServer,
  getStationOptionsServer,
} from "@/lib/api/reception-server"
import { requireRole } from "@/lib/auth/guard"
import { channelLabel, formatTime, priorityLabel } from "@/lib/reception/format"

import type { ReceptionQueueSnapshot } from "@/types/reception"

export default async function Page() {
  const user = await requireRole(["operator"])

  // A user has no department of their own: the station assignment carries it.
  // Resolving through stations keeps this working for an operator who moved
  // between service points without re-logging in.
  let departmentId: number | null = null

  if (user.station_id !== null) {
    try {
      const stations = await getStationOptionsServer()
      departmentId =
        stations.find((station) => station.id === user.station_id)
          ?.department_id ?? null
    } catch {
      departmentId = null
    }
  }

  let snapshot: ReceptionQueueSnapshot | null = null
  let queueError: string | null = null
  let invalidWorkflow = false

  if (departmentId !== null) {
    try {
      snapshot = await getReceptionQueueServer(departmentId)
    } catch (cause) {
      queueError = getApiErrorMessage(cause, "Gagal memuat antrean.")
      invalidWorkflow = getApiErrorType(cause) === "INVALID_WORKFLOW"
    }
  }

  let customerCount: number | null = null

  try {
    customerCount = await getCustomerCountServer()
  } catch {
    customerCount = null
  }

  const queueHref = "/operator/queue"

  const registrationHref =
    departmentId !== null
      ? `/operator/queue?department_id=${departmentId}`
      : "/operator/queue"

  const waitingPreview = snapshot?.waiting.slice(0, 5) ?? []

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
      <LiveRefresh facilityId={user.facility_ids[0] ?? null} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Reception</Badge>

            <span className="text-xs text-muted-foreground">
              {snapshot?.station.name ?? "Meja registrasi"}
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

        <div className="text-xs text-muted-foreground">
          Diperbarui otomatis secara langsung
        </div>
      </div>

      {departmentId === null && (
        <Card className="mt-6">
          <CardContent className="flex min-h-52 flex-col items-center justify-center gap-4 text-center">
            <div>
              <CardTitle>Akun belum ditugaskan ke departemen</CardTitle>

              <CardDescription className="mt-2">
                Hubungi administrator untuk mengatur department dan station
                kerja pada akun Anda.
              </CardDescription>
            </div>
          </CardContent>
        </Card>
      )}

      {invalidWorkflow && (
        <Alert variant="destructive" className="mt-6">
          <AlertTitle>Departemen belum siap menerima antrian</AlertTitle>

          <AlertDescription>
            {queueError ??
              "Departemen ini belum memiliki workflow registrasi aktif. Pilih departemen lain atau hubungi administrator."}
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
                      Pelanggan yang sedang dipanggil ke meja registrasi.
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
                        {snapshot.current_calling.visit?.client?.name ??
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
                            {ticket.visit?.client?.name ??
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
                href="/operator/customers"
                className={buttonVariants({ variant: "outline" })}
              >
                <SearchIcon />
                Cari Pelanggan
              </Link>

              {customerCount !== null && (
                <span className="self-center text-xs text-muted-foreground">
                  Total pelanggan terdaftar: {customerCount}
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
