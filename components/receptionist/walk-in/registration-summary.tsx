import { InfoIcon, UserPlusIcon } from "lucide-react"

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
import { Spinner } from "@/components/ui/spinner"

import type { Department, Patient } from "@/types/reception"

type RegistrationSummaryProps = {
  patientType: "existing" | "new"
  selectedPatient: Patient | null
  patientName: string
  department: Department | undefined
  disabled: boolean
  submitting: boolean
}

export function RegistrationSummary({
  patientType,
  selectedPatient,
  patientName,
  department,
  disabled,
  submitting,
}: RegistrationSummaryProps) {
  const displayPatientName =
    patientType === "existing" ? selectedPatient?.name : patientName

  return (
    <Card className="lg:sticky lg:top-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold tracking-tight">
            Ringkasan Kunjungan
          </CardTitle>

          <Badge variant="outline" className="text-[11px] font-medium">
            {patientType === "existing" ? "Pasien Lama" : "Pasien Baru"}
          </Badge>
        </div>

        <CardDescription className="text-xs text-muted-foreground">
          Periksa data sebelum membuat kunjungan baru.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3.5 rounded-lg border bg-card p-4">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Data Pasien
            </p>

            {displayPatientName ? (
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-foreground">
                  {displayPatientName}
                </p>
                {patientType === "existing" && (
                  <p className="font-mono text-xs text-muted-foreground">
                    RM:{" "}
                    {selectedPatient?.medical_record_number ??
                      "Belum ada No. RM"}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                {patientType === "existing"
                  ? "Belum ada pasien yang dipilih"
                  : "Nama pasien belum diisi"}
              </p>
            )}
          </div>

          <Separator />

          <div className="space-y-1">
            <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Departemen / Poli
            </p>

            {department ? (
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {department.name}
                </p>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  {department.code}
                </Badge>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Belum memilih departemen
              </p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2.5 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
          <InfoIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
          <p className="leading-relaxed">
            Nomor antrian akan dibuat secara otomatis setelah pendaftaran
            selesai.
          </p>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full gap-2 text-sm font-medium"
          disabled={disabled || submitting}
        >
          {submitting ? (
            <>
              <Spinner className="size-4 text-background" />
              Mendaftarkan...
            </>
          ) : (
            <>
              <UserPlusIcon className="size-4" />
              Daftarkan Kunjungan
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
