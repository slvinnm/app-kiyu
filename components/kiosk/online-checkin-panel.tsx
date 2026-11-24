"use client"

import { useState } from "react"
import {
  ArrowLeft,
  CheckCircle2,
  Keyboard,
  Loader2,
  Search,
  ScanLine,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

import { checkinOnlineBooking, lookupOnlineBooking } from "@/lib/api/kiosk"
import { priorityLabel } from "@/lib/reception/format"

import type { KioskCheckinResult, OnlineBookingLookup } from "@/types/kiosk"

type Phase =
  | { type: "input" }
  | { type: "looking-up" }
  | { type: "preview"; booking: OnlineBookingLookup }
  | { type: "checking-in"; booking: OnlineBookingLookup }
  | { type: "error"; message: string }

export function OnlineCheckinPanel({
  onBack,
  onCheckedIn,
}: {
  onBack: () => void
  onCheckedIn: (result: KioskCheckinResult, message?: string) => void
}) {
  const [identifier, setIdentifier] = useState("")
  const [phase, setPhase] = useState<Phase>({ type: "input" })

  async function handleLookup() {
    const value = identifier.trim()

    if (!value || phase.type === "looking-up") {
      return
    }

    setPhase({ type: "looking-up" })

    try {
      const response = await lookupOnlineBooking(value)
      setPhase({ type: "preview", booking: response.data })
    } catch (error) {
      setPhase({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Booking tidak ditemukan. Periksa kembali kode Anda.",
      })
    }
  }

  async function handleCheckin(booking: OnlineBookingLookup) {
    if (!booking.is_eligible_checkin) {
      setPhase({
        type: "error",
        message:
          "Booking ini tidak dapat di-check-in. Hubungi petugas reception.",
      })
      return
    }

    setPhase({ type: "checking-in", booking })

    try {
      // The code the customer typed is the only identifier they hold; the
      // preview deliberately does not echo it back.
      const response = await checkinOnlineBooking(identifier.trim())

      onCheckedIn(response.data, response.message)
    } catch (error) {
      setPhase({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Check-in gagal. Silakan coba lagi.",
      })
    }
  }

  function resetInput() {
    setIdentifier("")
    setPhase({ type: "input" })
  }

  return (
    <div className="w-full max-w-2xl">
      <Card className="overflow-hidden rounded-3xl">
        <div className="border-b bg-muted/40 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <ScanLine className="size-5" />
              </div>

              <div>
                <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                  Booking Online
                </p>

                <h2 className="text-xl font-bold tracking-tight">
                  Check-in Kunjungan
                </h2>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
              className="shrink-0"
            >
              <ArrowLeft />
              Kembali
            </Button>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {phase.type === "preview" || phase.type === "checking-in" ? (
            <PreviewContent
              booking={phase.booking}
              checkingIn={phase.type === "checking-in"}
              onConfirm={() => void handleCheckin(phase.booking)}
              onCancel={resetInput}
            />
          ) : (
            <div className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="booking-identifier"
                  className="text-sm font-medium"
                >
                  Kode Booking / Nomor Kunjungan
                </label>

                <div className="relative">
                  <Keyboard className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    id="booking-identifier"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault()
                        void handleLookup()
                      }
                    }}
                    placeholder="Contoh: ONLINE-123456"
                    className="h-14 pr-4 pl-12 text-lg"
                    autoComplete="off"
                    autoFocus
                  />
                </div>

                <p className="text-sm text-muted-foreground">
                  Masukkan kode booking dari aplikasi atau tunjukkan QR yang
                  Anda terima saat booking online.
                </p>
              </div>

              {phase.type === "error" && (
                <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                  <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />

                  <p className="text-sm text-destructive">{phase.message}</p>
                </div>
              )}

              <Button
                type="button"
                size="lg"
                className="h-14 w-full text-base"
                onClick={() => void handleLookup()}
                disabled={!identifier.trim() || phase.type === "looking-up"}
              >
                {phase.type === "looking-up" ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Mencari booking...
                  </>
                ) : (
                  <>
                    <Search />
                    Cari Booking
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

function PreviewContent({
  booking,
  checkingIn,
  onConfirm,
  onCancel,
}: {
  booking: OnlineBookingLookup
  checkingIn: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl border p-5">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-muted">
          <CheckCircle2 className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">Pelanggan</p>

          <p className="text-lg font-semibold">
            {booking.customer_preview.masked_name}
          </p>

          <p className="text-sm text-muted-foreground">
            Sesi antrean #{booking.session_number}
          </p>
        </div>

        <Badge
          variant={booking.is_eligible_checkin ? "default" : "outline"}
          className="shrink-0"
        >
          {booking.is_eligible_checkin ? "Siap check-in" : booking.status}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted-foreground">Departemen</p>

          <p className="mt-1 font-medium">{booking.department_name}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Nomor Sesi</p>

          <p className="mt-1 font-mono text-sm font-medium">
            {booking.session_number}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Status</p>

          <p className="mt-1 font-medium">{booking.status}</p>
        </div>
      </div>

      {!booking.is_eligible_checkin && (
        <div className="rounded-xl border p-4 text-sm text-muted-foreground">
          Booking ini sudah tidak dapat di-check-in (mungkin sudah check-in atau
          dibatalkan). Silakan hubungi petugas reception.
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={checkingIn}
        >
          Cari Lain
        </Button>

        <Button
          type="button"
          size="lg"
          onClick={onConfirm}
          disabled={checkingIn || !booking.is_eligible_checkin}
        >
          {checkingIn ? (
            <>
              <Loader2 className="animate-spin" />
              Memproses check-in...
            </>
          ) : (
            <>
              <CheckCircle2 />
              Konfirmasi Check-in
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
