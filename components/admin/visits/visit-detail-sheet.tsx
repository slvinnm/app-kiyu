"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"

import {
  getApiErrorMessage,
  getApiErrorType,
} from "@/lib/api/error"
import {
  cancelVisit,
  getVisitDetail,
  updateVisitPriority,
} from "@/lib/api/admin"
import {
  channelLabel,
  formatDateTime,
  priorityLabel,
  ticketStatusLabel,
  visitStatusLabel,
} from "@/lib/reception/format"

import { ReferralDialog } from "@/components/admin/visits/referral-dialog"

import type { AdminVisitDetail } from "@/types/admin"
import type { Department } from "@/types/reception"

const PRIORITIES = [
  { value: "1", label: "Normal" },
  { value: "2", label: "Prioritas" },
  { value: "3", label: "Darurat" },
]

export function VisitDetailSheet({
  visitId,
  actorEmail,
  departments,
  open,
  onOpenChange,
  onChanged,
}: {
  visitId: number | null
  actorEmail: string
  departments: Department[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onChanged: () => void
}) {
  const router = useRouter()
  const [visit, setVisit] = useState<AdminVisitDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [priority, setPriority] = useState("1")
  const [priorityProcessing, setPriorityProcessing] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelProcessing, setCancelProcessing] = useState(false)
  const [referralOpen, setReferralOpen] = useState(false)

  const load = useCallback(async () => {
    if (visitId === null) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await getVisitDetail(visitId)
      setVisit(response.data)
      setPriority(String(response.data.priority ?? 1))
    } catch (cause) {
      setError(getApiErrorMessage(cause, "Gagal memuat detail kunjungan."))
    } finally {
      setLoading(false)
    }
  }, [visitId])

  useEffect(() => {
    if (open && visitId !== null) {
      setVisit(null)
      setCancelReason("")
      void load()
    }
  }, [open, visitId, load])

  async function handlePriority() {
    if (!visit || priorityProcessing) {
      return
    }

    setPriorityProcessing(true)

    try {
      const response = await updateVisitPriority(visit.id, {
        priority: Number(priority),
        user_id: actorEmail,
      })

      toast.success(response.message ?? "Prioritas diperbarui.")
      await load()
      onChanged()
    } catch (cause) {
      toast.error(getApiErrorMessage(cause, "Gagal mengubah prioritas."))
    } finally {
      setPriorityProcessing(false)
    }
  }

  async function handleCancel() {
    if (!visit || cancelProcessing) {
      return
    }

    setCancelProcessing(true)

    try {
      const response = await cancelVisit(visit.id, {
        reason: cancelReason.trim() || undefined,
        user_id: actorEmail,
      })

      toast.success(response.message ?? "Kunjungan dibatalkan.")
      setCancelOpen(false)
      setCancelReason("")
      await load()
      onChanged()
      router.refresh()
    } catch (cause) {
      const message = getApiErrorMessage(cause, "Gagal membatalkan kunjungan.")
      const type = getApiErrorType(cause)

      toast.error(
        type === "INVALID_STATE"
          ? `${message} Kunjungan yang sudah selesai tidak dapat dibatalkan.`
          : message
      )

      setCancelOpen(false)
    } finally {
      setCancelProcessing(false)
    }
  }

  const cancellable =
    visit !== null &&
    visit.status !== "COMPLETED" &&
    visit.status !== "CANCELLED"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{visit?.visit_number ?? "Detail Kunjungan"}</SheetTitle>

          <SheetDescription>
            {visit?.department?.name ?? "Memuat detail kunjungan..."}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 overflow-y-auto px-4 pb-6">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner />
              Memuat detail kunjungan...
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          {visit && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  {visitStatusLabel(visit.status)}
                </Badge>

                <Badge variant="outline">
                  {priorityLabel(visit.priority)}
                </Badge>

                <Badge variant="outline">
                  {channelLabel(visit.intake_channel)}
                </Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Pasien</p>

                  <p className="mt-1 text-sm font-medium">
                    {visit.patient?.name ?? "-"}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {visit.patient?.mrn ?? "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Dibuat</p>

                  <p className="mt-1 text-sm font-medium">
                    {formatDateTime(visit.created_at)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Check-in</p>

                  <p className="mt-1 text-sm font-medium">
                    {formatDateTime(visit.checked_in_at)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Registrasi</p>

                  <p className="mt-1 text-sm font-medium">
                    {formatDateTime(visit.registered_at)}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-sm font-medium">Tindakan Admin</p>

                <div className="mt-3 space-y-3">
                  <div className="space-y-2">
                    <Label>Prioritas</Label>

                    <div className="flex gap-2">
                      <Select
                        value={priority}
                        onValueChange={(value) =>
                          setPriority(value ?? "1")
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                          {PRIORITIES.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        onClick={handlePriority}
                        disabled={priorityProcessing}
                      >
                        {priorityProcessing ? <Spinner /> : null}
                        Simpan
                      </Button>
                    </div>
                  </div>

                  {cancellable && (
                    <div className="space-y-2 border-t pt-3">
                      <Label htmlFor="cancel-reason">
                        Alasan pembatalan (opsional)
                      </Label>

                      <Textarea
                        id="cancel-reason"
                        value={cancelReason}
                        onChange={(event) =>
                          setCancelReason(event.target.value)
                        }
                        placeholder="Alasan pembatalan kunjungan"
                        rows={2}
                      />

                      <Button
                        variant="destructive"
                        onClick={() => setCancelOpen(true)}
                      >
                        Batalkan Kunjungan
                      </Button>
                    </div>
                  )}

                  <div className="space-y-2 border-t pt-3">
                    <Label>Referral</Label>

                    <p className="text-xs text-muted-foreground">
                      Rujuk pasien ke poli lain; kunjungan dan tiket tujuan
                      dibuat otomatis.
                    </p>

                    <Button
                      variant="outline"
                      onClick={() => setReferralOpen(true)}
                    >
                      Buat Referral
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium">Tiket Antrian</p>

                {!visit.queue_tickets?.length ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Belum ada tiket antrian.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {visit.queue_tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="rounded-xl border p-4 text-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold">
                            {ticket.queue_number}
                          </p>

                          <div className="flex gap-2">
                            <Badge variant="outline">
                              {ticketStatusLabel(ticket.status)}
                            </Badge>

                            <Badge variant="outline">
                              {priorityLabel(ticket.priority)}
                            </Badge>
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>{ticket.station?.name ?? "-"}</span>

                          <span>{ticket.workflow_step?.name ?? "-"}</span>

                          <span>{formatDateTime(ticket.created_at)}</span>
                        </div>

                        {ticket.events && ticket.events.length > 0 && (
                          <ul className="mt-3 space-y-1 border-t pt-3 text-xs text-muted-foreground">
                            {ticket.events.map((event) => (
                              <li key={event.id}>
                                {event.event_type}
                                {event.to_status
                                  ? ` → ${event.to_status}`
                                  : ""}{" "}
                                · {formatDateTime(event.created_at)}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan kunjungan ini?</AlertDialogTitle>

            <AlertDialogDescription>
              Kunjungan {visit?.visit_number ?? ""} dan tiket antrian aktifnya
              akan dibatalkan. Tindakan ini tercatat di audit log.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelProcessing}>
              Batal
            </AlertDialogCancel>

            <AlertDialogAction
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelProcessing}
            >
              {cancelProcessing ? "Membatalkan..." : "Batalkan Kunjungan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {visit && (
        <ReferralDialog
          open={referralOpen}
          onOpenChange={setReferralOpen}
          visit={visit}
          departments={departments}
          actorEmail={actorEmail}
          onCreated={() => {
            setReferralOpen(false)
            void load()
            onChanged()
            router.refresh()
          }}
        />
      )}
    </Sheet>
  )
}
