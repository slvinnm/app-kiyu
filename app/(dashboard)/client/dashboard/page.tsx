import Link from "next/link"
import { redirect } from "next/navigation"
import {
  ArrowRightIcon,
  BellRingIcon,
  CalendarPlusIcon,
  FileTextIcon,
  UserRoundIcon,
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

import { CustomerLoadError } from "@/components/client/client-notices"

import { getApiErrorMessage } from "@/lib/api/error"
import {
  getCurrentClientServer,
  getClientVisitsServer,
  getVisitDetailServer,
} from "@/lib/api/clients-server"
import {
  channelLabel,
  formatDateTime,
  priorityLabel,
  ticketStatusLabel,
  visitStatusLabel,
} from "@/lib/reception/format"

import type { CustomerVisitDetail } from "@/types/client"
import type { Visit } from "@/types/reception"

const ACTIVE_VISIT_STATUSES = ["AWAITING_CHECKIN", "WAITING", "IN_PROGRESS"]

const ACTIVE_TICKET_STATUSES = ["CREATED", "CALLED", "IN_PROGRESS", "ON_HOLD"]

export default async function Page() {
  let current

  try {
    current = await getCurrentClientServer()
  } catch (cause) {
    return (
      <PageShell>
        <CustomerLoadError
          message={getApiErrorMessage(cause, "Gagal memuat profil pelanggan.")}
        />
      </PageShell>
    )
  }

  if (!current.profile) {
    redirect("/client/onboarding")
  }

  const profile = current.profile

  let visits: Visit[] = []
  let visitsError: string | null = null

  try {
    const page = await getClientVisitsServer(profile.id, 50)
    visits = page.data
  } catch (cause) {
    visitsError = getApiErrorMessage(cause, "Gagal memuat kunjungan.")
  }

  const activeVisits = visits.filter((visit) =>
    ACTIVE_VISIT_STATUSES.includes(visit.status)
  )

  const detailResults = await Promise.all(
    activeVisits.slice(0, 3).map(async (visit) => {
      try {
        return await getVisitDetailServer(visit.id)
      } catch {
        return null
      }
    })
  )

  const activeTickets = detailResults
    .filter((detail): detail is CustomerVisitDetail => detail !== null)
    .flatMap((detail) =>
      (detail.queue_tickets ?? [])
        .filter((ticket) => ACTIVE_TICKET_STATUSES.includes(ticket.status))
        .map((ticket) => ({ ticket, visit: detail }))
    )

  const recentVisits = visits.slice(0, 5)

  return (
    <PageShell>
      {visitsError && (
        <Alert className="mt-6">
          <AlertTitle>Sebagian data tidak dapat dimuat</AlertTitle>

          <AlertDescription>{visitsError}</AlertDescription>
        </Alert>
      )}

      <div className="mt-6 space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard
            label="Kunjungan Aktif"
            value={activeVisits.length}
            icon={<FileTextIcon className="size-4" />}
          />

          <StatCard
            label="Antrian Aktif"
            value={activeTickets.length}
            icon={<BellRingIcon className="size-4" />}
          />

          <StatCard
            label="Total Kunjungan"
            value={visits.length}
            icon={<FileTextIcon className="size-4" />}
          />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Antrian Saya</CardTitle>

                <CardDescription>
                  Status antrian aktif pada kunjungan Anda.
                </CardDescription>
              </div>

              <Badge variant="outline">{activeTickets.length}</Badge>
            </div>
          </CardHeader>

          <CardContent>
            {activeTickets.length > 0 ? (
              <div className="space-y-3">
                {activeTickets.map(({ ticket, visit }) => (
                  <div key={ticket.id} className="rounded-xl border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-3xl font-black tracking-tight tabular-nums">
                          {ticket.queue_number}
                        </p>

                        <p className="mt-1 text-sm font-medium">
                          {ticket.station?.name ?? "Station"}
                        </p>
                      </div>

                      <Badge variant="outline">
                        {ticketStatusLabel(ticket.status)}
                      </Badge>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>{visit.department?.name ?? "-"}</span>

                      <span className="font-mono">{visit.visit_number}</span>

                      <span>{ticket.workflow_step?.name ?? "-"}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Tidak ada antrian aktif saat ini.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Kunjungan Aktif</CardTitle>

                  <CardDescription>
                    Kunjungan yang sedang berjalan.
                  </CardDescription>
                </div>

                <Badge variant="outline">{activeVisits.length}</Badge>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {activeVisits.length > 0 ? (
                <div>
                  {activeVisits.map((visit) => (
                    <div
                      key={visit.id}
                      className="flex items-center justify-between gap-3 border-t p-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {visit.department?.name ?? "Kunjungan"}
                        </p>

                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                          {visit.visit_number}
                        </p>
                      </div>

                      <Badge variant="outline">
                        {visitStatusLabel(visit.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm font-medium">
                    Tidak ada kunjungan aktif
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Buat booking online untuk merencanakan kunjungan.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Profil</CardTitle>

                  <CardDescription>Data pelanggan terhubung.</CardDescription>
                </div>

                <UserRoundIcon className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Nama</p>

                <p className="mt-1 font-medium">{profile.name}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Telepon</p>

                  <p className="mt-1 text-sm font-medium">
                    {profile.phone ?? "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Email</p>

                  <p className="mt-1 text-sm font-medium">
                    {profile.email ?? "-"}
                  </p>
                </div>
              </div>

              <Link
                href="/client/profile"
                className={buttonVariants({ variant: "outline" })}
              >
                Kelola Profil
                <ArrowRightIcon />
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aksi Cepat</CardTitle>
          </CardHeader>

          <CardContent className="flex flex-wrap items-center gap-2">
            <Link
              href="/client/booking"
              className={buttonVariants({ variant: "outline" })}
            >
              <CalendarPlusIcon />
              Booking Online
            </Link>

            <Link
              href="/client/visits"
              className={buttonVariants({ variant: "outline" })}
            >
              <FileTextIcon />
              Lihat Kunjungan
            </Link>

            <Link
              href="/client/profile"
              className={buttonVariants({ variant: "outline" })}
            >
              <UserRoundIcon />
              Profil
            </Link>
          </CardContent>
        </Card>

        {recentVisits.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Riwayat Terbaru</CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              {recentVisits.map((visit) => (
                <div
                  key={visit.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-t p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {visit.department?.name ?? "Kunjungan"}
                    </p>

                    <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      <span className="font-mono">{visit.visit_number}</span>

                      <span>{channelLabel(visit.intake_channel)}</span>

                      <span>{priorityLabel(visit.priority)}</span>

                      <span>{formatDateTime(visit.created_at)}</span>
                    </div>
                  </div>

                  <Badge variant="outline">
                    {visitStatusLabel(visit.status)}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  )
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Pelanggan</Badge>

          <span className="text-xs text-muted-foreground">
            Portal Pelanggan
          </span>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UserRoundIcon className="size-5" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dasbor</h1>

            <p className="text-sm text-muted-foreground">
              Ringkasan kunjungan, antrian, dan akses cepat layanan.
            </p>
          </div>
        </div>
      </div>

      {children}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string
  value: number
  icon: React.ReactNode
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border text-muted-foreground">
          {icon}
        </div>

        <div>
          <p className="text-xs text-muted-foreground">{label}</p>

          <p className="text-xl font-semibold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
