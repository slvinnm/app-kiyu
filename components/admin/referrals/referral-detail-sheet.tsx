"use client"

import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"

import { referralStatusLabel } from "@/lib/admin/referrals"
import { getApiErrorMessage } from "@/lib/api/error"
import { getReferral } from "@/lib/api/admin"
import {
  formatDateTime,
  priorityLabel,
  ticketStatusLabel,
  visitStatusLabel,
} from "@/lib/reception/format"

import type { ReferralDetail } from "@/types/admin"

export function ReferralDetailSheet({
  referralId,
  open,
  onOpenChange,
}: {
  referralId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [referral, setReferral] = useState<ReferralDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || referralId === null) {
      return
    }

    let active = true
    const controller = new AbortController()

    setLoading(true)
    setError(null)
    setReferral(null)

    getReferral(referralId, controller.signal)
      .then((response) => {
        if (active) setReferral(response.data)
      })
      .catch((cause) => {
        if (active && !controller.signal.aborted) {
          setError(getApiErrorMessage(cause, "Gagal memuat referral."))
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [open, referralId])

  const targetTickets = referral?.target_visit?.queue_tickets ?? []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>
            Referral #{referral?.id ?? "-"}
          </SheetTitle>

          <SheetDescription>
            {referral?.source_visit?.visit_number ?? "Memuat referral..."}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 overflow-y-auto px-4 pb-6">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner />
              Memuat referral...
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          {referral && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  {referralStatusLabel(referral.status)}
                </Badge>

                <Badge variant="outline">
                  {priorityLabel(referral.priority)}
                </Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Pasien Sumber
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {referral.source_visit?.patient?.name ?? "-"}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {referral.source_visit?.patient?.mrn ?? "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Kunjungan Sumber
                  </p>

                  <p className="mt-1 font-mono text-sm font-medium">
                    {referral.source_visit?.visit_number ?? "-"}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {referral.source_visit
                      ? visitStatusLabel(referral.source_visit.status)
                      : "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Department Tujuan
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {referral.target_department?.name ?? "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Dibuat</p>

                  <p className="mt-1 text-sm font-medium">
                    {formatDateTime(referral.created_at)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Direferensikan Oleh
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {referral.referred_by_user_id ?? "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Alasan</p>

                  <p className="mt-1 text-sm font-medium">
                    {referral.reason ?? "-"}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium">Kunjungan Tujuan</p>

                {!referral.target_visit ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Belum ada kunjungan tujuan.
                  </p>
                ) : (
                  <div className="mt-2 space-y-3">
                    <div className="rounded-xl border p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-mono text-sm font-medium">
                          {referral.target_visit.visit_number}
                        </p>

                        <Badge variant="outline">
                          {visitStatusLabel(referral.target_visit.status)}
                        </Badge>
                      </div>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {referral.target_visit.department?.name ??
                          referral.target_department?.name ??
                          "-"}
                      </p>
                    </div>

                    {targetTickets.length > 0 && (
                      <div className="space-y-2">
                        {targetTickets.map((ticket) => (
                          <div
                            key={ticket.id}
                            className="flex items-center justify-between rounded-xl border p-3 text-sm"
                          >
                            <span className="font-semibold">
                              {ticket.queue_number}
                            </span>

                            <Badge variant="outline">
                              {ticketStatusLabel(ticket.status)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
