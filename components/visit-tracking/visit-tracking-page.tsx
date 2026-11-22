"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"

import {
  Activity,
  AlertCircle,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Ticket,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { StatusBadge } from "@/components/visit-tracking/status-badge"
import { VisitJourney } from "@/components/visit-tracking/visit-journey"
import { VisitTimeline } from "@/components/visit-tracking/visit-timeline"

import { getVisitTracking } from "@/lib/api/visit-tracking"

import type {
  TrackingAcquisition,
  TrackingReferral,
  VisitTrackingData,
} from "@/types/visit-tracking"

type VisitTrackingPageProps = {
  token: string
}

const REFRESH_INTERVAL = 15_000

function formatDateTime(value: string | null) {
  if (!value) return "—"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "—"

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function formatChannel(channel: string | null) {
  switch (channel) {
    case "KIOSK":
      return "Kiosk"
    case "ONLINE":
      return "Pendaftaran online"
    case "MANUAL":
      return "Pendaftaran petugas"
    default:
      return channel ?? "Tidak diketahui"
  }
}

function VisitOverview({
  data,
}: {
  data: VisitTrackingData
}) {
  const progress = Math.min(
    100,
    Math.max(0, data.summary.progress_percentage ?? 0)
  )

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Nomor kunjungan
            </p>

            <p className="mt-1 font-mono text-lg font-bold tracking-tight sm:text-xl">
              {data.visit.visit_number}
            </p>
          </div>

          <StatusBadge status={data.visit.status} />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {data.patient.name || "Pasien"}
          </h1>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="size-4 shrink-0" />
            <span>{data.department.name ?? "Departemen"}</span>
            {data.department.code && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                {data.department.code}
              </span>
            )}
          </div>

          {data.visit.timestamps.registered_at && (
  <div className="flex items-center gap-2 text-xs text-muted-foreground">
    <CalendarClock className="size-3.5 shrink-0" />
    <span>
      Terdaftar:{" "}
      {formatDateTime(data.visit.timestamps.registered_at)}
    </span>
  </div>
)}
        </div>

        <div className="flex gap-3 rounded-lg bg-muted/60 p-3.5">
          <div className="mt-0.5 shrink-0">
            {data.visit.status === "COMPLETED" ? (
              <CheckCircle2 className="size-5 text-emerald-600" />
            ) : data.visit.status === "CANCELLED" ? (
              <AlertCircle className="size-5 text-destructive" />
            ) : (
              <Clock3 className="size-5 text-primary" />
            )}
          </div>

          <div>
            <p className="text-sm font-medium">
              {data.summary.message}
            </p>

            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Informasi kunjungan dan antrean dapat berubah mengikuti
              proses pelayanan.
            </p>
          </div>
        </div>

        <div className="mt-auto space-y-2">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="font-medium text-muted-foreground">
              Tahapan layanan tercatat selesai
            </span>

            <span className="font-semibold tabular-nums">
              {data.summary.completed_steps} dari{" "}
              {data.summary.total_steps}
            </span>
          </div>

          <div
            className="h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label="Progres tahapan layanan"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-[11px] text-muted-foreground">
            Progres indikatif berdasarkan tahapan workflow yang
            dikonfigurasi.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function CurrentQueueCard({
  data,
}: {
  data: VisitTrackingData
}) {
  const queue = data.current_queue

  return (
    <Card className="h-full">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">
              Antrean saat ini
            </CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              Informasi antrean aktif Anda.
            </p>
          </div>

          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Ticket className="size-5" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-52 flex-col items-center justify-center p-5 text-center">
        {queue ? (
          <>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Nomor antrean
            </p>

            <p className="my-2 font-mono text-5xl font-bold tracking-tight sm:text-6xl">
              {queue.queue_number}
            </p>

            <StatusBadge status={queue.status} />

            <div className="mt-5 flex flex-col items-center gap-2 text-sm">
              {queue.station && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-4" />
                  <span className="font-medium text-foreground">
                    {queue.station.name}
                  </span>
                </div>
              )}

              {queue.called_at && (
                <p className="text-xs text-muted-foreground">
                  Dipanggil: {formatDateTime(queue.called_at)}
                </p>
              )}

              {queue.started_at && (
                <p className="text-xs text-muted-foreground">
                  Mulai layanan: {formatDateTime(queue.started_at)}
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
              <Clock3 className="size-6 text-muted-foreground" />
            </div>

            <p className="text-sm font-semibold">
              Belum ada antrean aktif
            </p>

            <p className="mt-1 max-w-64 text-xs leading-relaxed text-muted-foreground">
              {data.visit.status === "AWAITING_CHECKIN"
                ? "Selesaikan proses check-in terlebih dahulu."
                : data.visit.status === "COMPLETED"
                  ? "Seluruh proses kunjungan telah selesai."
                  : data.visit.status === "CANCELLED"
                    ? "Kunjungan ini telah dibatalkan."
                    : "Informasi antrean akan muncul di sini setelah diterbitkan."}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function VisitDetails({
  acquisitions,
  referrals,
}: {
  acquisitions: TrackingAcquisition[]
  referrals: TrackingReferral[]
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">
            Informasi pendaftaran
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {acquisitions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Tidak ada informasi pendaftaran.
            </p>
          ) : (
            acquisitions.map((item, index) => (
              <div
                key={`${item.channel}-${item.created_at}-${index}`}
                className="space-y-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">
                    {formatChannel(item.channel)}
                  </span>

                  <StatusBadge status={item.status} />
                </div>

                {item.department && (
                  <p className="text-xs text-muted-foreground">
                    {item.department.name}
                  </p>
                )}

                <p className="text-xs text-muted-foreground">
                  {formatDateTime(item.created_at)}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {referrals.length > 0 && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-base">
              Rujukan layanan
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            {referrals.map((referral, index) => (
              <div
                key={`${referral.created_at}-${index}`}
                className="space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    {referral.target_department?.name ??
                      "Departemen tujuan"}
                  </p>

                  <StatusBadge status={referral.status} />
                </div>

                {referral.target_visit && (
                  <div className="rounded-md bg-muted/60 p-2.5">
                    <p className="text-xs text-muted-foreground">
                      Nomor kunjungan tujuan
                    </p>

                    <p className="mt-1 font-mono text-sm font-semibold">
                      {referral.target_visit.visit_number}
                    </p>

                    <div className="mt-2">
                      <StatusBadge
                        status={referral.target_visit.status}
                      />
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  {formatDateTime(referral.created_at)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function TrackingSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="h-[30rem] animate-pulse rounded-xl bg-muted" />
        <div className="h-80 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  )
}

export function VisitTrackingPage({
  token,
}: VisitTrackingPageProps) {
  const [data, setData] = useState<VisitTrackingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshFailed, setRefreshFailed] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const hasDataRef = useRef(false)
  const inFlightRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const loadTracking = useCallback(async (background = false) => {
    if (inFlightRef.current) return

    inFlightRef.current = true

    const controller = new AbortController()
    abortControllerRef.current = controller

    if (!background && !hasDataRef.current) {
      setIsLoading(true)
    } else {
      setIsRefreshing(true)
    }

    try {
      const result = await getVisitTracking(token, controller.signal)

      hasDataRef.current = true
      setData(result)
      setError(null)
      setRefreshFailed(false)
      setLastUpdated(new Date())
    } catch (caughtError) {
      if (controller.signal.aborted) return

      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Terjadi kesalahan saat memuat informasi kunjungan."

      if (!hasDataRef.current) {
        setError(message)
      } else {
        // Keep the last successfully loaded tracking data visible.
        setRefreshFailed(true)
      }
    } finally {
      inFlightRef.current = false
      abortControllerRef.current = null

      if (!controller.signal.aborted) {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    }
  }, [token])

  useEffect(() => {
    void loadTracking()

    const interval = window.setInterval(() => {
      const status = dataStatusRef.current

      if (status !== "COMPLETED" && status !== "CANCELLED") {
        void loadTracking(true)
      }
    }, REFRESH_INTERVAL)

    return () => {
      window.clearInterval(interval)
      abortControllerRef.current?.abort()
    }
  }, [loadTracking])

  // Keep the latest status available to the polling callback without
  // restarting the interval every time a response is received.
  const dataStatusRef = useRef<string | null>(null)
  dataStatusRef.current = data?.visit.status ?? null

  const updatedText = lastUpdated
    ? new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(lastUpdated)
    : null

  return (
    <div className="min-h-svh bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Activity className="size-5" />
            </div>

            <div>
              <p className="text-sm font-bold tracking-tight">
                KIYU
              </p>

              <p className="text-[11px] text-muted-foreground">
                Pelacakan kunjungan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {updatedText && (
              <span className="hidden text-xs text-muted-foreground sm:inline">
                Diperbarui {updatedText}
              </span>
            )}

            <Button
              variant="outline"
              size="icon"
              aria-label="Perbarui informasi kunjungan"
              onClick={() => void loadTracking(true)}
              disabled={isRefreshing || isLoading}
            >
              <RefreshCw
                className={[
                  "size-4",
                  isRefreshing ? "animate-spin" : "",
                ].join(" ")}
              />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
        {isLoading ? (
          <TrackingSkeleton />
        ) : error ? (
          <Card className="mx-auto max-w-lg">
            <CardContent className="flex flex-col items-center px-6 py-12 text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertCircle className="size-6" />
              </div>

              <h1 className="text-lg font-semibold">
                Tidak dapat memuat kunjungan
              </h1>

              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                {error}
              </p>

              <Button
                className="mt-6"
                onClick={() => void loadTracking()}
                disabled={isRefreshing}
              >
                <RefreshCw className="size-4" />
                Coba lagi
              </Button>
            </CardContent>
          </Card>
        ) : data ? (
          <>
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Pelacakan kunjungan
              </p>

              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                Pantau perjalanan layanan Anda
              </h1>

              <p className="text-sm text-muted-foreground">
                Informasi antrean dan tahapan layanan dalam satu halaman.
              </p>
            </div>

            {refreshFailed && (
              <div
                role="status"
                className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
              >
                <AlertCircle className="size-4 shrink-0" />
                <span>
                  Gagal memperbarui informasi. Data terakhir yang berhasil
                  dimuat tetap ditampilkan.
                </span>
              </div>
            )}

            <section className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
              <VisitOverview data={data} />
              <CurrentQueueCard data={data} />
            </section>

            <section className="grid items-start gap-4 lg:grid-cols-[1.3fr_0.9fr]">
              <div className="space-y-4">
                <VisitJourney journey={data.journey} />
              </div>

              <div className="space-y-4">
                <VisitTimeline timeline={data.timeline} />

                <VisitDetails
                  acquisitions={data.acquisitions}
                  referrals={data.referrals}
                />
              </div>
            </section>
          </>
        ) : null}

        <footer className="flex flex-col items-center justify-center gap-2 border-t pt-5 text-center">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="size-3.5" />
            Informasi kunjungan pribadi
          </div>

          <p className="max-w-lg text-[11px] leading-relaxed text-muted-foreground">
            Halaman ini hanya menampilkan informasi status kunjungan dan
            antrean. Jangan bagikan tautan pelacakan ini kepada orang lain.
          </p>

          <p className="mt-1 text-[11px] text-muted-foreground">
            {isRefreshing
              ? "Memperbarui informasi..."
              : "Pembaruan otomatis setiap 15 detik"}
          </p>
        </footer>
      </main>
    </div>
  )
}