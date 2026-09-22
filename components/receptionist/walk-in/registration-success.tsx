import { CheckCircle2Icon, PrinterIcon } from "lucide-react"

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

import type { WalkInSuccess } from "@/types/reception"

type RegistrationSuccessProps = {
  success: WalkInSuccess
  onReset: () => void
}

export function RegistrationSuccess({
  success,
  onReset,
}: RegistrationSuccessProps) {
  const queueTicket = success.visit.queue_tickets[0]

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-6">
      <Card className="w-full max-w-2xl overflow-hidden">
        <CardHeader className="border-b bg-muted/30 pb-6">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400">
              <CheckCircle2Icon className="size-8" />
            </div>

            <Badge variant="secondary" className="mb-3 rounded-full px-3 py-1">
              Registrasi berhasil
            </Badge>

            <CardTitle className="text-2xl">
              Pasien berhasil didaftarkan
            </CardTitle>

            <CardDescription className="mt-1">
              Kunjungan pasien telah berhasil dibuat.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          <div className="rounded-2xl border bg-background p-6 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Nomor Antrian
            </p>

            <p className="mt-2 text-6xl font-bold tracking-tight">
              {queueTicket?.queue_number ?? "-"}
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              {success.visit.department?.name ?? "-"}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                Pasien
              </p>

              <p className="mt-1 text-lg font-semibold">
                {success.patientName}
              </p>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Visit</p>

                <p className="mt-1 text-sm font-medium">
                  {success.visit.visit_number}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Status</p>

                <p className="mt-1 text-sm font-medium">
                  {success.visit.status ?? "-"}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Station</p>

                <p className="mt-1 text-sm font-medium">
                  {queueTicket?.station?.name ?? "-"}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Station Code</p>

                <p className="mt-1 text-sm font-medium">
                  {queueTicket?.station?.code ?? "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <Button type="button" variant="outline" className="h-11">
              <PrinterIcon />
              Cetak Nomor Antrian
            </Button>

            <Button type="button" onClick={onReset} className="h-11">
              Registrasi Pasien Berikutnya
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
