import Link from "next/link"
import { redirect } from "next/navigation"
import {
  ArrowRightIcon,
  BellRingIcon,
  ClipboardListIcon,
  RefreshCwIcon,
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

import { ClinicalStats } from "@/components/clinical/clinical-stats"

import { getApiErrorMessage } from "@/lib/api/error"
import { getStationQueueServer } from "@/lib/api/clinical-server"
import { getSession } from "@/lib/auth/session"
import {
  priorityLabel,
  stationTypeLabel,
  ticketStatusLabel,
} from "@/lib/reception/format"

import type { ClinicalQueueSnapshot } from "@/types/clinical"

function roleLabel(role: string): string {
  if (role === "nurse") return "Perawat"
  if (role === "doctor") return "Dokter"
  if (role === "pharmacy") return "Farmasi"
  if (role === "lab") return "Laboratorium"
  if (role === "billing") return "Kasir"
  return role
}

export async function ClinicalDashboard({ role }: { role: string }) {
  const session = await getSession()

  if (!session?.user?.role) {
    redirect("/login")
  }

  const basePath = `/${role}`
  const queuePath = `${basePath}/queue`
  const label = roleLabel(role)
  const stationId = session.user.station_id ?? null

  if (stationId === null) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
        <DashboardHeader label={label} stationCode={null} stationName={null} />

        <Card className="mt-6">
          <CardContent className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
            <CardTitle>Station belum ditugaskan</CardTitle>

            <CardDescription>
              Akun Anda belum memiliki station klinis. Hubungi administrator
              untuk mengatur station kerja.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    )
  }

  let snapshot: ClinicalQueueSnapshot | null = null
  let error: string | null = null

  try {
    snapshot = await getStationQueueServer(stationId)
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat antrian station.")
  }

  if (!snapshot) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
        <DashboardHeader label={label} stationCode={null} stationName={null} />

        <Card className="mt-6">
          <CardContent className="flex min-h-64 flex-col items-center justify-center gap-4 text-center">
            <div>
              <CardTitle>Tidak dapat memuat antrian</CardTitle>

              <CardDescription className="mt-2">
                {error ?? "Terjadi kesalahan saat memuat station."}
              </CardDescription>
            </div>

            <Link
              href={basePath + "/dashboard"}
              className={buttonVariants({ variant: "outline" })}
            >
              <RefreshCwIcon />
              Muat Ulang
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { station, tickets } = snapshot
  const inProgress = tickets.filter((t) => t.status === "IN_PROGRESS")
  const called = tickets.filter((t) => t.status === "CALLED")
  const waiting = tickets.filter((t) => t.status === "CREATED")
  const onHold = tickets.filter((t) => t.status === "ON_HOLD")
  const current = inProgress[0] ?? called[0] ?? null
  const waitingPreview = waiting.slice(0, 5)

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
      <DashboardHeader
        label={label}
        stationCode={station.code}
        stationName={`${stationTypeLabel(station.type)} · ${station.name}`}
      />

      <div className="mt-6 space-y-5">
        {!station.is_active && (
          <Alert variant="destructive">
            <AlertTitle>Station tidak aktif</AlertTitle>

            <AlertDescription>
              Station ini dinonaktifkan. Hubungi administrator sebelum
              memproses antrian.
            </AlertDescription>
          </Alert>
        )}

        <ClinicalStats
          waiting={waiting.length}
          called={called.length}
          inProgress={inProgress.length}
          onHold={onHold.length}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Pasien Saat Ini</CardTitle>

                  <CardDescription>
                    Pasien yang sedang ditangani di station Anda.
                  </CardDescription>
                </div>

                <Badge variant="outline">
                  {current ? ticketStatusLabel(current.status) : "Kosong"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              {current ? (
                <div className="space-y-4">
                  <div className="rounded-xl border p-6 text-center">
                    <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                      Nomor Antrian
                    </p>

                    <p className="mt-2 text-5xl font-black tracking-tight tabular-nums">
                      {current.queue_number}
                    </p>

                    <p className="mt-3 text-sm font-medium">
                      {current.visit?.patient?.name ??
                        "Pasien belum teridentifikasi"}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {current.workflow_step?.name ?? "-"}
                    </p>
                  </div>

                  <Link
                    href={queuePath}
                    className={buttonVariants({ variant: "outline" })}
                  >
                    Buka Antrian
                    <ArrowRightIcon />
                  </Link>
                </div>
              ) : (
                <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-center">
                  <BellRingIcon className="size-6 text-muted-foreground" />

                  <p className="text-sm font-medium">
                    Tidak ada pasien aktif
                  </p>

                  <Link href={queuePath} className={buttonVariants()}>
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
                    Pasien berikutnya di station Anda.
                  </CardDescription>
                </div>

                <Badge variant="outline">{waiting.length}</Badge>
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
                            "Pasien belum teridentifikasi"}
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
              href={queuePath}
              className={buttonVariants({ variant: "outline" })}
            >
              <ClipboardListIcon />
              Buka Antrian {label}
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DashboardHeader({
  label,
  stationCode,
  stationName,
}: {
  label: string
  stationCode: string | null
  stationName: string | null
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Badge variant="outline">{stationCode ?? "Station"}</Badge>

        <span className="text-xs text-muted-foreground">
          {stationName ?? "Station klinis"}
        </span>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight">Dasbor {label}</h1>

      <p className="mt-1 text-sm text-muted-foreground">
        Ringkasan antrian dan akses cepat ke workspace station.
      </p>
    </div>
  )
}
