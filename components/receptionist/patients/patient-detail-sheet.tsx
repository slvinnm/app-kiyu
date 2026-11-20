"use client"

import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"

import { getApiErrorMessage } from "@/lib/api/error"
import { getPatient } from "@/lib/api/reception"
import {
  channelLabel,
  formatDate,
  formatDateTime,
  genderLabel,
  priorityLabel,
  ticketStatusLabel,
  visitStatusLabel,
} from "@/lib/reception/format"

import type { PatientDetail } from "@/types/reception"

export function PatientDetailSheet({
  patientId,
  open,
  onOpenChange,
}: {
  patientId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [patient, setPatient] = useState<PatientDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || patientId === null) {
      return
    }

    let active = true
    const controller = new AbortController()

    setLoading(true)
    setError(null)
    setPatient(null)

    getPatient(patientId, controller.signal)
      .then((response) => {
        if (active) {
          setPatient(response.data)
        }
      })
      .catch((cause) => {
        if (active && !controller.signal.aborted) {
          setError(getApiErrorMessage(cause, "Gagal memuat data pasien."))
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [open, patientId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{patient?.name ?? "Detail Pasien"}</DialogTitle>

          <DialogDescription>
            {patient?.mrn ? `No. RM ${patient.mrn}` : "Memuat data pasien..."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pb-2">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner />
              Memuat data pasien...
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          {patient && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">NIK</p>

                  <p className="mt-1 text-sm font-medium">
                    {patient.nik ?? "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Tanggal Lahir
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {formatDate(patient.date_of_birth)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Jenis Kelamin
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {genderLabel(patient.gender)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Telepon</p>

                  <p className="mt-1 text-sm font-medium">
                    {patient.phone ?? "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Email</p>

                  <p className="mt-1 truncate text-sm font-medium">
                    {patient.email ?? "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Alamat</p>

                  <p className="mt-1 text-sm font-medium">
                    {patient.address ?? "-"}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium">Riwayat Kunjungan</p>

                {!patient.visits?.length ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Belum ada kunjungan.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {patient.visits.map((visit) => (
                      <div
                        key={visit.id}
                        className="rounded-xl border p-4 text-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-mono font-medium">
                            {visit.visit_number}
                          </p>

                          <Badge variant="outline">
                            {visitStatusLabel(visit.status)}
                          </Badge>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>{visit.department?.name ?? "-"}</span>

                          <span>{channelLabel(visit.intake_channel)}</span>

                          <span>{priorityLabel(visit.priority)}</span>

                          <span>{formatDateTime(visit.created_at)}</span>
                        </div>

                        {visit.active_queue_ticket && (
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                            <Badge variant="secondary">
                              {visit.active_queue_ticket.queue_number}
                            </Badge>

                            <span className="text-muted-foreground">
                              {ticketStatusLabel(
                                visit.active_queue_ticket.status
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
