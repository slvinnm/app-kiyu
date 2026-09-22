import { RefreshCcwIcon, UserIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { Patient, QueueAcquisition } from "@/types/reception"

type QueueAcquisitionSummaryProps = {
  acquisition: QueueAcquisition
  selectedPatient: Patient | null
  onReset: () => void
}

export function QueueAcquisitionSummary({
  acquisition,
  selectedPatient,
  onReset,
}: QueueAcquisitionSummaryProps) {
  return (
    <Card className="h-fit lg:sticky lg:top-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold tracking-tight">
            Ringkasan Acquisition
          </CardTitle>

          <Badge
            variant="outline"
            className="text-[11px] font-medium capitalize"
          >
            {acquisition.status ?? "-"}
          </Badge>
        </div>

        <CardDescription className="text-xs text-muted-foreground">
          Queue dari kiosk berhasil ditemukan.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-xl border border-dashed bg-muted/40 p-4 text-center">
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Nomor Antrian
          </p>

          <p className="mt-1 font-mono text-4xl font-black tracking-tight text-foreground">
            {acquisition.queue_ticket?.queue_number ?? "-"}
          </p>
        </div>

        <div className="space-y-2.5 rounded-lg border bg-muted/20 p-3.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">ID Acquisition</span>
            <span className="font-mono font-medium text-foreground">
              #{acquisition.id}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Poli / Departemen</span>
            <span className="truncate text-right font-medium text-foreground">
              {acquisition.department?.name ?? "-"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">No. Visit</span>
            <span className="font-mono font-medium text-foreground">
              {acquisition.visit?.visit_number ?? "-"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Channel</span>
            <span className="font-medium text-foreground capitalize">
              {acquisition.channel ?? "-"}
            </span>
          </div>
        </div>

        <Separator />

        <div className="rounded-lg border bg-card p-3.5">
          <div className="mb-1 flex items-center gap-1.5">
            <UserIcon className="size-3.5 text-muted-foreground" />
            <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Pasien Terpilih
            </p>
          </div>

          {selectedPatient ? (
            <div className="space-y-0.5 pt-0.5">
              <p className="text-sm font-semibold text-foreground">
                {selectedPatient.name}
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                {selectedPatient.medical_record_number ??
                  "No. RM belum tersedia"}
              </p>
            </div>
          ) : (
            <p className="pt-0.5 text-xs text-muted-foreground italic">
              Belum ada pasien yang dipilih
            </p>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full gap-2 text-xs font-medium"
          onClick={onReset}
        >
          <RefreshCcwIcon className="size-3.5" />
          Cari Acquisition Lain
        </Button>
      </CardContent>
    </Card>
  )
}
