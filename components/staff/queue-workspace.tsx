"use client"

import { useState } from "react"
import { RefreshCwIcon } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"

import { StaffCompleteSuccess } from "@/components/staff/complete-success"
import { StaffCurrentTicket } from "@/components/staff/current-ticket"
import { StaffLists } from "@/components/staff/staff-lists"
import { StaffNotesDialog } from "@/components/staff/notes-dialog"
import { StaffStats } from "@/components/staff/stats"
import { StaffTransferDialog } from "@/components/staff/transfer-dialog"

import { useStaffQueue } from "@/hooks/use-staff-queue"

import {
  callNextClinical,
  cancelTicket,
  completeTicket,
  holdTicket,
  noShowTicket,
  recallTicket,
  resumeTicket,
  skipTicket,
  startTicket,
} from "@/lib/api/staff"
import { getApiErrorMessage } from "@/lib/api/error"
import { formatTime, stationTypeLabel } from "@/lib/reception/format"

import type { CompleteTicketResult } from "@/types/staff"
import type { QueueTicket } from "@/types/reception"

type NotesActionType = "hold" | "skip" | "no-show" | "cancel" | "complete"

type NotesAction = {
  type: NotesActionType
  ticket: QueueTicket
}

const NOTES_COPY: Record<
  NotesActionType,
  {
    title: string
    description: string
    confirmLabel: string
    destructive?: boolean
  }
> = {
  hold: {
    title: "Tahan Pasien",
    description:
      "Pasien akan ditandai ditahan dan dapat dilanjutkan kembali nanti.",
    confirmLabel: "Tahan",
  },
  skip: {
    title: "Lewati Pasien",
    description: "Pasien akan dilewati dari antrian station ini.",
    confirmLabel: "Lewati",
    destructive: true,
  },
  "no-show": {
    title: "Tandai Tidak Hadir",
    description: "Pasien akan ditandai tidak hadir dan antrian ditutup.",
    confirmLabel: "Tandai Tidak Hadir",
    destructive: true,
  },
  cancel: {
    title: "Batalkan Tiket",
    description: "Tiket akan dibatalkan dan tidak dapat diproses lagi.",
    confirmLabel: "Batalkan",
    destructive: true,
  },
  complete: {
    title: "Selesaikan Pelayanan",
    description:
      "Tiket akan diselesaikan dan workflow dilanjutkan ke langkah berikutnya.",
    confirmLabel: "Selesaikan",
  },
}

export function StaffQueueWorkspace({
  stationId,
  departmentId,
  actorEmail,
  role,
}: {
  stationId: number | null
  departmentId: number | null
  actorEmail: string
  role: string
}) {
  const [notesAction, setNotesAction] = useState<NotesAction | null>(null)
  const [transferTarget, setTransferTarget] = useState<QueueTicket | null>(null)
  const [completeResult, setCompleteResult] =
    useState<CompleteTicketResult | null>(null)
  const [processing, setProcessing] = useState(false)
  const [focusedCalledId, setFocusedCalledId] = useState<number | null>(null)

  const {
    station,
    waiting,
    called,
    inProgress,
    onHold,
    loading,
    refreshing,
    error,
    lastUpdatedAt,
    isConnected,
    refresh,
  } = useStaffQueue(stationId, {
    actorEmail,
    paused:
      notesAction !== null ||
      transferTarget !== null ||
      completeResult !== null,
  })

  const roleLabel = role === "staff" ? "Staff" : role

  const focusedCalled =
    called.find((ticket) => ticket.id === focusedCalledId) ?? null

  const currentTicket = inProgress[0] ?? focusedCalled ?? called[0] ?? null

  async function runAction(
    fallbackMessage: string,
    action: () => Promise<{ message?: string }>
  ) {
    setProcessing(true)

    try {
      const response = await action()
      toast.success(response.message ?? fallbackMessage)
      await refresh()
    } catch (cause) {
      toast.error(getApiErrorMessage(cause, fallbackMessage))
      await refresh()
    } finally {
      setProcessing(false)
    }
  }

  async function handleCallNext() {
    if (!stationId || processing || currentTicket) {
      return
    }

    setProcessing(true)
    setFocusedCalledId(null)

    try {
      const response = await callNextClinical(stationId, actorEmail)

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

  async function handleNotesConfirm(notes: string) {
    if (!notesAction) {
      return
    }

    const { type, ticket } = notesAction
    const payload = {
      notes: notes.trim() || undefined,
      user_id: actorEmail,
    }

    setProcessing(true)

    try {
      if (type === "hold") {
        const response = await holdTicket(ticket.id, payload)
        toast.success(response.message ?? "Pasien ditahan.")
      } else if (type === "skip") {
        const response = await skipTicket(ticket.id, payload)
        toast.success(response.message ?? "Pasien dilewati.")
      } else if (type === "no-show") {
        const response = await noShowTicket(ticket.id, payload)
        toast.success(response.message ?? "Pasien ditandai tidak hadir.")
      } else if (type === "cancel") {
        const response = await cancelTicket(ticket.id, payload)
        toast.success(response.message ?? "Tiket dibatalkan.")
      } else {
        const response = await completeTicket(ticket.id, payload)
        toast.success(response.message ?? "Pelayanan selesai.")
        setCompleteResult(response.data)
      }

      setNotesAction(null)
      await refresh()
    } catch (cause) {
      toast.error(getApiErrorMessage(cause, "Aksi tidak dapat diproses."))
      setNotesAction(null)
      await refresh()
    } finally {
      setProcessing(false)
    }
  }

  const header = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="outline">{station?.code ?? "Station"}</Badge>

          <span className="text-xs text-muted-foreground">
            {station
              ? `${stationTypeLabel(station.type)} · ${station.name}`
              : "Station klinis"}
          </span>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          Antrian {roleLabel}
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Kelola pasien pada station yang ditugaskan kepada Anda.
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

  if (stationId === null) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
        {header}

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

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
        {header}

        {loading && !station ? (
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
        ) : error && !station ? (
          <Card className="mt-6">
            <CardContent className="flex min-h-64 flex-col items-center justify-center gap-4 text-center">
              <div>
                <CardTitle>Tidak dapat memuat antrian</CardTitle>

                <CardDescription className="mt-2">{error}</CardDescription>
              </div>

              <Button onClick={() => void refresh()} disabled={refreshing}>
                {refreshing ? <Spinner /> : <RefreshCwIcon />}
                Coba Lagi
              </Button>
            </CardContent>
          </Card>
        ) : station ? (
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

            {error && (
              <Alert>
                <AlertTitle>Antrian mungkin sudah berubah</AlertTitle>

                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <StaffStats
              waiting={waiting.length}
              called={called.length}
              inProgress={inProgress.length}
              onHold={onHold.length}
            />

            {!isConnected && (
              <p className="text-xs text-muted-foreground">
                Terakhir diperbarui{" "}
                {lastUpdatedAt ? formatTime(lastUpdatedAt.toISOString()) : "-"}{" "}
                · diperbarui otomatis setiap 15 detik
              </p>
            )}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_380px]">
              <StaffCurrentTicket
                ticket={currentTicket}
                processing={processing || !station.is_active}
                canCallNext={
                  waiting.length > 0 &&
                  currentTicket === null &&
                  station.is_active &&
                  !processing
                }
                onCallNext={handleCallNext}
                onStart={(ticket) =>
                  void runAction("Pelayanan dimulai.", () =>
                    startTicket(ticket.id, actorEmail)
                  )
                }
                onHold={(ticket) => setNotesAction({ type: "hold", ticket })}
                onComplete={(ticket) =>
                  setNotesAction({ type: "complete", ticket })
                }
                onRecall={(ticket) =>
                  void runAction("Panggilan diulang.", () =>
                    recallTicket(ticket.id, actorEmail)
                  )
                }
                onSkip={(ticket) => setNotesAction({ type: "skip", ticket })}
                onNoShow={(ticket) =>
                  setNotesAction({ type: "no-show", ticket })
                }
                onCancel={(ticket) =>
                  setNotesAction({ type: "cancel", ticket })
                }
                onTransfer={setTransferTarget}
              />

              <StaffLists
                waiting={waiting}
                called={called}
                onHold={onHold}
                currentTicketId={currentTicket?.id ?? null}
                processing={processing || !station.is_active}
                focusDisabled={inProgress.length > 0}
                onResume={(ticket) =>
                  void runAction("Pasien dilanjutkan.", () =>
                    resumeTicket(ticket.id, actorEmail)
                  )
                }
                onFocus={(ticket) => setFocusedCalledId(ticket.id)}
              />
            </div>
          </div>
        ) : null}
      </div>

      <StaffNotesDialog
        open={notesAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setNotesAction(null)
          }
        }}
        title={notesAction ? NOTES_COPY[notesAction.type].title : ""}
        description={
          notesAction ? NOTES_COPY[notesAction.type].description : ""
        }
        confirmLabel={
          notesAction ? NOTES_COPY[notesAction.type].confirmLabel : "Simpan"
        }
        destructive={
          notesAction ? NOTES_COPY[notesAction.type].destructive : false
        }
        processing={processing}
        onConfirm={handleNotesConfirm}
      />

      <StaffTransferDialog
        ticket={transferTarget}
        departmentId={departmentId}
        stationType={station?.type ?? null}
        currentStationId={stationId}
        actorEmail={actorEmail}
        open={transferTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setTransferTarget(null)
          }
        }}
        onTransferred={() => void refresh()}
      />

      <Dialog
        open={completeResult !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCompleteResult(null)
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-xl">
          {completeResult && (
            <StaffCompleteSuccess
              result={completeResult}
              onDone={() => {
                setCompleteResult(null)
                void refresh()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
