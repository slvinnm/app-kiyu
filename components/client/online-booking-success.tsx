"use client"

import Link from "next/link"
import { CheckCircle2Icon, CopyIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import { channelLabel, visitStatusLabel } from "@/lib/reception/format"

import type { Department } from "@/types/reception"
import type { OnlineBookingResult } from "@/types/client"

export function OnlineBookingSuccess({
  result,
  department,
  onReset,
}: {
  result: OnlineBookingResult
  department: Department | null
  onReset: () => void
}) {
  const { visit } = result
  const bookingIdentifier = visit.online_active_key ?? visit.visit_number

  async function copyIdentifier() {
    try {
      await navigator.clipboard.writeText(bookingIdentifier)
      toast.success("Kode booking disalin.")
    } catch {
      toast.error("Gagal menyalin kode booking.")
    }
  }

  return (
    <Card className="mx-auto max-w-2xl overflow-hidden">
      <CardContent className="space-y-6 p-6 text-center md:p-8">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border bg-muted">
          <CheckCircle2Icon className="size-7" />
        </div>

        <div>
          <Badge variant="outline">Booking berhasil</Badge>

          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            Kunjungan online dibuat
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Tunjukkan kode booking di kiosk saat tiba untuk check-in.
          </p>
        </div>

        <div className="rounded-2xl border p-6">
          <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Kode Booking
          </p>

          <p className="mt-2 font-mono text-2xl font-bold break-all">
            {bookingIdentifier}
          </p>

          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={copyIdentifier}
          >
            <CopyIcon />
            Salin Kode
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Kunjungan</p>

            <p className="mt-1 font-mono text-sm font-semibold">
              {visit.visit_number}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Poli</p>

            <p className="mt-1 text-sm font-semibold">
              {department?.name ?? visit.department?.name ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Status</p>

            <p className="mt-1 text-sm font-semibold">
              {visitStatusLabel(visit.status)}
            </p>
          </div>
        </div>

        <Separator />

        <div className="rounded-xl bg-muted/50 p-4 text-left text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Langkah selanjutnya</p>

          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Datang ke klinik sesuai jadwal.</li>
            <li>Lakukan check-in di kiosk dengan kode booking di atas.</li>
            <li>Tunggu panggilan reception untuk verifikasi data.</li>
          </ol>
        </div>

        <p className="text-xs text-muted-foreground">
          Channel: {channelLabel(visit.intake_channel)}
        </p>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          <Button variant="outline" onClick={onReset}>
            Booking Lagi
          </Button>

          <Link
            href="/client/visits"
            className={buttonVariants({ size: "lg" })}
          >
            Lihat Kunjungan
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
