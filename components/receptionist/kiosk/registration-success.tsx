import { CheckCircle2Icon, PrinterIcon, ArrowRightIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { KioskRegistrationSuccess } from "@/types/reception"

type RegistrationSuccessProps = {
  success: KioskRegistrationSuccess
  onReset: () => void
}

export function RegistrationSuccess({
  success,
  onReset,
}: RegistrationSuccessProps) {
  const { patient, acquisition } = success

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-xl">
        <CardHeader className="pt-3 pb-4 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full border bg-muted text-foreground">
            <CheckCircle2Icon className="size-6" />
          </div>

          <CardTitle className="text-xl font-bold tracking-tight sm:text-2xl">
            Registrasi Berhasil
          </CardTitle>

          <CardDescription className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Pasien telah terdaftar dan siap untuk alur pelayanan berikutnya.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-6 pb-8">
          <div className="relative space-y-2 rounded-xl border border-dashed bg-muted/40 p-6 text-center">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Nomor Antrian
            </p>

            <p className="py-1 font-mono text-5xl font-black tracking-tight text-foreground sm:text-6xl">
              {acquisition.queue_ticket?.queue_number ?? "-"}
            </p>

            <div className="pt-1">
              <Badge
                variant="outline"
                className="bg-background px-3 py-1 text-xs font-medium"
              >
                {acquisition.department?.name ?? "Departemen Belum Dipilih"}
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border bg-card p-4">
              <div className="space-y-0.5">
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Nama Pasien
                </p>
                <p className="text-base font-semibold text-foreground">
                  {patient.name}
                </p>
              </div>
              <div className="space-y-0.5 text-right">
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  No. Rekam Medis
                </p>
                <p className="font-mono text-sm font-medium text-foreground">
                  {patient.medical_record_number ?? "Belum ada No. RM"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/20 p-3.5 text-xs">
              <div>
                <span className="block text-[11px] text-muted-foreground">
                  No. Kunjungan (Visit)
                </span>
                <span className="font-mono font-medium text-foreground">
                  {acquisition.visit?.visit_number ?? "-"}
                </span>
              </div>
              <div>
                <span className="block text-[11px] text-muted-foreground">
                  Status
                </span>
                <span className="font-medium text-foreground capitalize">
                  {acquisition.status ?? "-"}
                </span>
              </div>
              <div>
                <span className="block text-[11px] text-muted-foreground">
                  Channel
                </span>
                <span className="font-medium text-foreground capitalize">
                  {acquisition.channel ?? "-"}
                </span>
              </div>
              <div>
                <span className="block text-[11px] text-muted-foreground">
                  ID Akuisisi
                </span>
                <span className="font-mono font-medium text-foreground">
                  #{acquisition.id}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full gap-2 text-sm font-medium"
            >
              <PrinterIcon className="size-4" />
              Cetak Antrian
            </Button>

            <Button
              type="button"
              size="lg"
              className="w-full gap-2 text-sm font-medium"
              onClick={onReset}
            >
              Registrasi Berikutnya
              <ArrowRightIcon className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
