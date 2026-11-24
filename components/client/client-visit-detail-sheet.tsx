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
import { getVisitDetail } from "@/lib/api/clients"
import {
  channelLabel,
  formatDateTime,
  priorityLabel,
  ticketStatusLabel,
  visitStatusLabel,
} from "@/lib/reception/format"

import type { ClientQueueTicket, CustomerVisitDetail } from "@/types/client"

function activeTickets(tickets: ClientQueueTicket[]) {
  return tickets.filter((ticket) =>
    ["CREATED", "CALLED", "IN_PROGRESS", "ON_HOLD"].includes(ticket.status)
  )
}

export function CustomerVisitDetailSheet({
  visitId,
  open,
  onOpenChange,
}: {
  visitId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [visit, setVisit] = useState<CustomerVisitDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || visitId === null) {
      return
    }

    let active = true
    const controller = new AbortController()

    setLoading(true)
    setError(null)
    setVisit(null)

    getVisitDetail(visitId, controller.signal)
      .then((response) => {
        if (active) {
          setVisit(response.data)
        }
      })
      .catch((cause) => {
        if (active && !controller.signal.aborted) {
          setError(getApiErrorMessage(cause, "Gagal memuat detail kunjungan."))
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
  }, [open, visitId])

  const tickets = visit?.queue_tickets ?? []
  const active = activeTickets(tickets)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {visit?.department?.name ?? "Detail Kunjungan"}
          </DialogTitle>

          <DialogDescription>
            {visit?.visit_number ?? "Memuat detail kunjungan..."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pb-2">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner />
              Memuat detail kunjungan...
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          {visit && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>

                  <p className="mt-1 text-sm font-medium">
                    {visitStatusLabel(visit.status)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Channel</p>

                  <p className="mt-1 text-sm font-medium">
                    {channelLabel(visit.intake_channel)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Prioritas</p>

                  <p className="mt-1 text-sm font-medium">
                    {priorityLabel(visit.priority)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Dibuat</p>

                  <p className="mt-1 text-sm font-medium">
                    {formatDateTime(visit.created_at)}
                  </p>
                </div>
              </div>

              {visit.intake_channel === "ONLINE" && (
                <div className="rounded-xl border bg-muted/40 p-4">
                  <p className="text-xs text-muted-foreground">Kode Booking</p>

                  <p className="mt-1 font-mono text-sm font-semibold break-all">
                    {visit.online_active_key ?? "-"}
                  </p>

                  {visit.status === "AWAITING_CHECKIN" && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Tunjukkan kode ini di kiosk untuk check-in.
                    </p>
                  )}
                </div>
              )}

              <Separator />

              {active.length > 0 && (
                <div className="rounded-xl border p-4">
                  <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                    Antrian Aktif
                  </p>

                  {active.map((ticket) => (
                    <div key={ticket.id} className="mt-3 space-y-1">
                      <p className="text-3xl font-black tracking-tight tabular-nums">
                        {ticket.queue_number}
                      </p>

                      <p className="text-sm font-medium">
                        {ticket.station?.name ?? "Station"}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {ticket.workflow_step?.name ?? "-"} ·{" "}
                        {ticketStatusLabel(ticket.status)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {visit.status === "AWAITING_CHECKIN" && tickets.length === 0 && (
                <div className="rounded-xl border p-4 text-sm text-muted-foreground">
                  Kunjungan menunggu check-in. Lakukan check-in di kiosk untuk
                  mendapatkan nomor antrian reception.
                </div>
              )}

              <div>
                <p className="text-sm font-medium">Tiket Antrian</p>

                {tickets.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Belum ada tiket antrian.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="rounded-xl border p-4 text-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold">{ticket.queue_number}</p>

                          <Badge variant="outline">
                            {ticketStatusLabel(ticket.status)}
                          </Badge>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>{ticket.station?.name ?? "-"}</span>

                          <span>{ticket.workflow_step?.name ?? "-"}</span>

                          <span>{priorityLabel(ticket.priority)}</span>
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
      </DialogContent>
    </Dialog>
  )
}
