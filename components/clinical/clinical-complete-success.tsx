import { CheckCircle2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"

import { visitStatusLabel } from "@/lib/reception/format"

import type { CompleteTicketResult } from "@/types/clinical"

export function ClinicalCompleteSuccess({
  result,
  onDone,
}: {
  result: CompleteTicketResult
  onDone: () => void
}) {
  const { visit, next_ticket: nextTicket } = result

  return (
    <div className="space-y-6 px-6 py-6">
      <div className="text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border bg-muted">
          <CheckCircle2Icon className="size-7" />
        </div>

        <h2 className="mt-4 text-xl font-semibold">Pelayanan selesai</h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Tiket di station ini telah diselesaikan.
        </p>
      </div>

      <div className="rounded-xl border p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Pasien</p>

            <p className="mt-1 font-medium">
              {visit.patient?.name ?? "Pasien terdaftar"}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Nomor Kunjungan</p>

            <p className="mt-1 font-mono text-sm font-medium">
              {visit.visit_number}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Status Kunjungan</p>

            <p className="mt-1 font-medium">
              {visitStatusLabel(visit.status)}
            </p>
          </div>
        </div>
      </div>

      {nextTicket ? (
        <div className="rounded-xl border p-5 text-center">
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
            Langkah Berikutnya
          </p>

          <p className="mt-2 text-5xl font-bold tracking-tight tabular-nums">
            {nextTicket.queue_number}
          </p>

          <p className="mt-3 text-sm font-medium">
            {nextTicket.station?.name ?? "Station berikutnya"}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {nextTicket.workflow_step?.name ?? "Langkah workflow berikutnya"}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border p-5 text-center">
          <p className="text-sm font-medium">Workflow selesai</p>

          <p className="mt-1 text-xs text-muted-foreground">
            Tidak ada langkah berikutnya. Kunjungan telah selesai.
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={onDone}>Selesai</Button>
      </div>
    </div>
  )
}
