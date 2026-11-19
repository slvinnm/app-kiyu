import Link from "next/link"
import { CheckCircle2Icon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import { channelLabel, priorityLabel } from "@/lib/reception/format"

import type { Department, ManualIntakeResult } from "@/types/reception"

export function ManualIntakeSuccess({
  result,
  department,
  onReset,
}: {
  result: ManualIntakeResult
  department: Department | null
  onReset: () => void
}) {
  const { visit, ticket } = result

  return (
    <Card className="mx-auto max-w-2xl overflow-hidden rounded-3xl">
      <CardContent className="space-y-6 p-6 text-center md:p-8">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border bg-muted">
          <CheckCircle2Icon className="size-7" />
        </div>

        <div>
          <Badge variant="outline">Antrian berhasil dibuat</Badge>

          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            Pasien masuk antrian reception
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Pasien akan dipanggil petugas untuk melengkapi registrasi.
          </p>
        </div>

        <div className="rounded-2xl border p-6">
          <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Nomor Antrian
          </p>

          <p className="mt-2 text-6xl font-black tracking-tight tabular-nums">
            {ticket.queue_number}
          </p>

          <p className="mt-3 text-sm font-medium">
            {department?.name ?? visit.department?.name ?? "-"}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {ticket.station?.name ?? "Meja registrasi"}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Kunjungan</p>

            <p className="mt-1 font-mono text-sm font-semibold">
              {visit.visit_number}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Channel</p>

            <p className="mt-1 text-sm font-semibold">
              {channelLabel(visit.intake_channel)}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Prioritas</p>

            <p className="mt-1 text-sm font-semibold">
              {priorityLabel(visit.priority)}
            </p>
          </div>
        </div>

        <Separator />

        <p className="text-xs text-muted-foreground">
          Data pasien belum tercatat. Lengkapi saat registrasi di halaman
          Antrian.
        </p>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          <Button variant="outline" onClick={onReset}>
            Intake Berikutnya
          </Button>

          <Link
            href={`/receptionist/queue?department_id=${visit.department_id}`}
            className={buttonVariants({ size: "lg" })}
          >
            Buka Antrian
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
