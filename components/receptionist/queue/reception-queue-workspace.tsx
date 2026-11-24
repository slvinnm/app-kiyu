"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"

import { CompleteRegistrationDialog } from "@/components/receptionist/queue/complete-registration-dialog"
import { CurrentTicketCard } from "@/components/receptionist/queue/current-ticket-card"
import { QueueStatCards } from "@/components/receptionist/queue/queue-stat-cards"
import { WaitingList } from "@/components/receptionist/queue/waiting-list"

import { useReceptionQueue } from "@/hooks/use-reception-queue"

import { getApiErrorMessage } from "@/lib/api/error"
import {
  callNext,
  noShowTicket,
  recallTicket,
  skipTicket,
} from "@/lib/api/reception"
import { formatTime } from "@/lib/reception/format"

import type { QueueTicket } from "@/types/reception"

export function ReceptionQueueWorkspace({
  departmentId,
  facilityId,
  actorEmail,
}: {
  departmentId: number | null
  facilityId: number | null
  actorEmail: string
}) {
  const [selectedTicket, setSelectedTicket] = useState<QueueTicket | null>(null)
  const [skipTarget, setSkipTarget] = useState<QueueTicket | null>(null)
  const [noShowTarget, setNoShowTarget] = useState<QueueTicket | null>(null)
  const [skipReason, setSkipReason] = useState("")
  const [processing, setProcessing] = useState(false)

  // Close any open dialog when the selected department changes so a stale
  // ticket from the previous department is never submitted.
  useEffect(() => {
    setSelectedTicket(null)
    setSkipTarget(null)
    setNoShowTarget(null)
    setSkipReason("")
  }, [departmentId])

  const {
    snapshot,
    loading,
    refreshing,
    error,
    invalidWorkflow,
    lastUpdatedAt,
    isConnected,
    refresh,
  } = useReceptionQueue(departmentId, {
    facilityId,
    paused:
      selectedTicket !== null || skipTarget !== null || noShowTarget !== null,
  })

  async function handleCallNext() {
    if (!departmentId || processing || snapshot?.current_calling) {
      return
    }

    setProcessing(true)

    try {
      const response = await callNext(departmentId, actorEmail)

      if (!response.data) {
        toast.info(response.message ?? "Tidak ada antrian yang siap dipanggil.")
      } else {
        toast.success(
          response.message ??
            `Antrian ${response.data.queue_number} berhasil dipanggil.`
        )
      }

      await refresh()
    } catch (cause) {
      toast.error(getApiErrorMessage(cause, "Gagal memanggil antrian."))

      await refresh()
    } finally {
      setProcessing(false)
    }
  }

  async function handleRecall(ticket: QueueTicket) {
    setProcessing(true)

    try {
      const response = await recallTicket(ticket.id, actorEmail)

      toast.success(response.message ?? "Antrian dipanggil ulang.")

      await refresh()
    } catch (cause) {
      toast.error(getApiErrorMessage(cause, "Gagal memanggil ulang antrian."))

      await refresh()
    } finally {
      setProcessing(false)
    }
  }

  async function handleSkipConfirm() {
    if (!skipTarget) {
      return
    }

    setProcessing(true)

    try {
      const response = await skipTicket(skipTarget.id, {
        reason: skipReason.trim() || undefined,
        user_id: actorEmail,
      })

      toast.success(response.message ?? "Antrian dilewati.")
    } catch (cause) {
      toast.error(getApiErrorMessage(cause, "Gagal melewati antrian."))
    } finally {
      setSkipTarget(null)
      setSkipReason("")
      setProcessing(false)
      await refresh()
    }
  }

  async function handleNoShowConfirm() {
    if (!noShowTarget) {
      return
    }

    setProcessing(true)

    try {
      const response = await noShowTicket(noShowTarget.id, actorEmail)

      toast.success(response.message ?? "Antrian ditandai tidak hadir.")
    } catch (cause) {
      toast.error(
        getApiErrorMessage(cause, "Gagal menandai antrian tidak hadir.")
      )
    } finally {
      setNoShowTarget(null)
      setProcessing(false)
      await refresh()
    }
  }

  const header = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="outline">
            {snapshot?.station.code ?? "Reception"}
          </Badge>

          <span className="text-xs text-muted-foreground">
            {snapshot?.station.name ?? "Meja registrasi"}
          </span>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">Antrian</h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Panggil pelanggan, selesaikan registrasi, dan teruskan ke layanan.
        </p>
      </div>

      {isConnected && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {refreshing && <Spinner className="size-3.5" />}
          <span>Diperbarui otomatis secara langsung</span>
        </div>
      )}
    </div>
  )

  if (departmentId === null) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
        {header}

        <Card className="mt-6">
          <CardContent className="flex min-h-64 flex-col items-center justify-center gap-4 text-center">
            <div>
              <CardTitle>Akun belum ditugaskan ke departemen</CardTitle>

              <CardDescription className="mt-2">
                Hubungi administrator untuk mengatur department dan station
                kerja pada akun Anda.
              </CardDescription>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
        {header}

        {invalidWorkflow ? (
          <Alert variant="destructive" className="mt-6">
            <AlertTitle>Departemen belum siap menerima antrian</AlertTitle>

            <AlertDescription>
              {error ??
                "Departemen ini belum memiliki workflow registrasi aktif. Pilih departemen lain atau hubungi administrator."}
            </AlertDescription>
          </Alert>
        ) : loading && !snapshot ? (
          <div className="mt-6 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_380px]">
              <Skeleton className="h-[420px]" />
              <Skeleton className="h-[420px]" />
            </div>
          </div>
        ) : error && !snapshot ? (
          <Card className="mt-6">
            <CardContent className="flex min-h-64 flex-col items-center justify-center gap-4 text-center">
              <div>
                <CardTitle>Tidak dapat memuat antrian</CardTitle>

                <CardDescription className="mt-2">{error}</CardDescription>
              </div>

              <Button onClick={() => void refresh()} disabled={refreshing}>
                {refreshing ? <Spinner /> : null}
                Coba Lagi
              </Button>
            </CardContent>
          </Card>
        ) : snapshot ? (
          <div className="mt-6 space-y-5">
            {error && (
              <Alert>
                <AlertTitle>Antrian mungkin sudah berubah</AlertTitle>

                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <QueueStatCards
              waitingCount={snapshot.waiting_count}
              currentCalling={snapshot.current_calling !== null}
              calledToday={snapshot.called_count_today}
              onHoldCount={snapshot.on_hold.length}
            />

            {!isConnected && (
              <p className="text-xs text-muted-foreground">
                Terakhir diperbarui{" "}
                {lastUpdatedAt ? formatTime(lastUpdatedAt.toISOString()) : "-"}{" "}
                · diperbarui otomatis setiap 15 detik
              </p>
            )}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_380px]">
              <CurrentTicketCard
                ticket={snapshot.current_calling}
                processing={processing}
                canCallNext={
                  snapshot.waiting_count > 0 &&
                  snapshot.current_calling === null &&
                  !invalidWorkflow
                }
                onCallNext={handleCallNext}
                onComplete={setSelectedTicket}
                onRecall={handleRecall}
                onSkip={setSkipTarget}
                onNoShow={setNoShowTarget}
              />

              <WaitingList
                tickets={snapshot.waiting}
                onHold={snapshot.on_hold}
                onProcess={setSelectedTicket}
              />
            </div>
          </div>
        ) : null}
      </div>

      <CompleteRegistrationDialog
        ticket={selectedTicket}
        actorEmail={actorEmail}
        open={selectedTicket !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTicket(null)
          }
        }}
        onCompleted={() => void refresh()}
      />

      <AlertDialog
        open={skipTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSkipTarget(null)
            setSkipReason("")
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lewati antrian ini?</AlertDialogTitle>

            <AlertDialogDescription>
              {skipTarget?.queue_number ?? "Antrian ini"} akan ditandai
              dilewati. Pelanggan tidak akan dipanggil lagi pada antrean ini.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <Label htmlFor="skip-reason">Alasan (opsional)</Label>

            <Textarea
              id="skip-reason"
              value={skipReason}
              onChange={(event) => setSkipReason(event.target.value)}
              placeholder="Misalnya: pelanggan tidak ada di ruang tunggu"
              rows={3}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Batal</AlertDialogCancel>

            <AlertDialogAction
              onClick={handleSkipConfirm}
              disabled={processing}
            >
              {processing ? "Memproses..." : "Lewati"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={noShowTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setNoShowTarget(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tandai tidak hadir?</AlertDialogTitle>

            <AlertDialogDescription>
              {noShowTarget?.queue_number ?? "Antrian ini"} akan ditandai tidak
              hadir dan tidak dapat dipanggil lagi.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Batal</AlertDialogCancel>

            <AlertDialogAction
              onClick={handleNoShowConfirm}
              disabled={processing}
            >
              {processing ? "Memproses..." : "Tandai Tidak Hadir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
