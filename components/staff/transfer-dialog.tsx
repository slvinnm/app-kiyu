"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"

import { getApiErrorMessage } from "@/lib/api/error"
import { getStations, transferTicket } from "@/lib/api/clinical"

import type { QueueTicket, Station } from "@/types/reception"

export function ClinicalTransferDialog({
  ticket,
  departmentId,
  stationType,
  currentStationId,
  actorEmail,
  open,
  onOpenChange,
  onTransferred,
}: {
  ticket: QueueTicket | null
  departmentId: number | null
  stationType: string | null
  currentStationId: number | null
  actorEmail: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onTransferred: () => void
}) {
  const [stations, setStations] = useState<Station[]>([])
  const [targetStationId, setTargetStationId] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || departmentId === null || !stationType) {
      return
    }

    let active = true
    const controller = new AbortController()

    setLoading(true)
    setError(null)
    setTargetStationId("")
    setNotes("")

    getStations(
      { department_id: departmentId, type: stationType },
      controller.signal
    )
      .then((response) => {
        if (!active) return

        const candidates = response.data.filter(
          (station) => station.is_active && station.id !== currentStationId
        )

        setStations(candidates)
      })
      .catch((cause) => {
        if (active && !controller.signal.aborted) {
          setError(
            getApiErrorMessage(cause, "Gagal memuat station tujuan transfer.")
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [open, departmentId, stationType, currentStationId])

  async function handleSubmit() {
    if (!ticket || !targetStationId || submitting) {
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await transferTicket(ticket.id, {
        target_station_id: Number(targetStationId),
        notes: notes.trim() || undefined,
        user_id: actorEmail,
      })

      toast.success(
        response.message ?? `Tiket ${ticket.queue_number} berhasil ditransfer.`
      )

      onOpenChange(false)
      onTransferred()
    } catch (cause) {
      setError(getApiErrorMessage(cause, "Gagal mentransfer tiket."))
      toast.error(getApiErrorMessage(cause, "Gagal mentransfer tiket."))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Tiket</DialogTitle>

          <DialogDescription>
            Pindahkan {ticket?.queue_number ?? "tiket"} ke station lain dengan
            tipe yang sama di department ini.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner />
              Memuat station...
            </div>
          ) : stations.length === 0 ? (
            <Alert>
              <AlertTitle>Tidak ada station tujuan</AlertTitle>

              <AlertDescription>
                Tidak ada station aktif lain dengan tipe yang sama di department
                ini.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              <Label>Station Tujuan</Label>

              <Select
                value={targetStationId}
                onValueChange={(value) => setTargetStationId(value ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih station tujuan" />
                </SelectTrigger>

                <SelectContent>
                  {stations.map((station) => (
                    <SelectItem key={station.id} value={String(station.id)}>
                      {station.name} ({station.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="transfer-notes">Catatan (opsional)</Label>

            <Textarea
              id="transfer-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Alasan transfer"
              rows={2}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Transfer gagal</AlertTitle>

              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Batal
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={
              submitting || loading || !targetStationId || stations.length === 0
            }
          >
            {submitting ? (
              <>
                <Spinner />
                Mentransfer...
              </>
            ) : (
              "Transfer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
