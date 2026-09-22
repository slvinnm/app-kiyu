import {
  CalendarDaysIcon,
  CheckCircle2Icon,
  IdCardIcon,
  PhoneIcon,
  RefreshCwIcon,
  UserRoundIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import type { Patient, QueueAcquisition } from "@/types/reception"

type SelectedPatientProps = {
  patient: Patient
  acquisition: QueueAcquisition
  registering: boolean
  onChangePatient: () => void
  onRegister: () => void
}

export function SelectedPatient({
  patient,
  acquisition,
  registering,
  onChangePatient,
  onRegister,
}: SelectedPatientProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[11px] font-medium">
                Pasien Terpilih
              </Badge>
            </div>

            <CardTitle className="truncate text-lg font-bold tracking-tight text-foreground sm:text-xl">
              {patient.name}
            </CardTitle>

            <p className="font-mono text-xs text-muted-foreground">
              RM: {patient.medical_record_number ?? "Belum tersedia"}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onChangePatient}
            disabled={registering}
            className="w-full shrink-0 gap-1.5 text-xs font-medium sm:w-auto"
          >
            <RefreshCwIcon className="size-3.5 text-muted-foreground" />
            Ganti Pasien
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Verifikasi Data Pasien
          </p>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-md border bg-muted/20 p-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">
                <IdCardIcon className="size-4" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-[10px] font-medium text-muted-foreground uppercase">
                  No. RM
                </p>
                <p className="truncate font-mono text-xs font-semibold text-foreground">
                  {patient.medical_record_number ?? "-"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-md border bg-muted/20 p-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">
                <CalendarDaysIcon className="size-4" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-[10px] font-medium text-muted-foreground uppercase">
                  Tanggal Lahir
                </p>
                <p className="font-mono text-xs font-semibold text-foreground">
                  {patient.date_of_birth ?? "-"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-md border bg-muted/20 p-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">
                <UserRoundIcon className="size-4" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-[10px] font-medium text-muted-foreground uppercase">
                  Jenis Kelamin
                </p>
                <p className="text-xs font-semibold text-foreground">
                  {patient.gender === "male"
                    ? "Laki-laki"
                    : patient.gender === "female"
                      ? "Perempuan"
                      : "-"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-md border bg-muted/20 p-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">
                <PhoneIcon className="size-4" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-[10px] font-medium text-muted-foreground uppercase">
                  No. Telepon
                </p>
                <p className="font-mono text-xs font-semibold text-foreground">
                  {patient.phone ?? "-"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-background text-foreground shadow-xs">
              <CheckCircle2Icon className="size-4" />
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Konfirmasi Pendaftaran
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Nomor antrian{" "}
                <span className="font-mono font-bold text-foreground">
                  {acquisition.queue_ticket?.queue_number ?? "-"}
                </span>{" "}
                dari{" "}
                <span className="font-semibold text-foreground">
                  {acquisition.department?.name ?? "-"}
                </span>{" "}
                akan dihubungkan dengan pasien ini.
              </p>
            </div>
          </div>
        </div>

        <Separator />

        <Button
          type="button"
          size="lg"
          className="w-full gap-2 text-sm font-medium"
          onClick={onRegister}
          disabled={registering}
        >
          {registering ? (
            <>
              <Spinner className="size-4 text-background" />
              Mendaftarkan Pasien...
            </>
          ) : (
            <>
              <CheckCircle2Icon className="size-4" />
              Daftarkan {patient.name}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
