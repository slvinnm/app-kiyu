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
import { getCustomer } from "@/lib/api/reception"
import {
  channelLabel,
  formatDateTime,
  priorityLabel,
  ticketStatusLabel,
  visitStatusLabel,
} from "@/lib/reception/format"

import type { CustomerDetail } from "@/types/reception"

export function CustomerDetailSheet({
  customerId,
  open,
  onOpenChange,
}: {
  customerId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || customerId === null) {
      return
    }

    let active = true
    const controller = new AbortController()

    setLoading(true)
    setError(null)
    setCustomer(null)

    getCustomer(customerId, controller.signal)
      .then((response) => {
        if (active) {
          setCustomer(response.data)
        }
      })
      .catch((cause) => {
        if (active && !controller.signal.aborted) {
          setError(getApiErrorMessage(cause, "Gagal memuat data pelanggan."))
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
  }, [open, customerId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{customer?.name ?? "Detail Pelanggan"}</DialogTitle>

          <DialogDescription>
            {customer
              ? (customer.email ?? "Pelanggan tanpa email")
              : "Memuat data pelanggan..."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pb-2">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner />
              Memuat data pelanggan...
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          {customer && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Alamat</p>

                  <p className="mt-1 text-sm font-medium">
                    {customer.address ?? "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Telepon</p>

                  <p className="mt-1 text-sm font-medium">
                    {customer.phone ?? "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Email</p>

                  <p className="mt-1 truncate text-sm font-medium">
                    {customer.email ?? "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Alamat</p>

                  <p className="mt-1 text-sm font-medium">
                    {customer.address ?? "-"}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium">Riwayat Kunjungan</p>

                {!customer.visits?.length ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Belum ada kunjungan.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {customer.visits.map((visit) => (
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
