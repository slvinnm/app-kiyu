import { UserPlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ringkasan</CardTitle>

        <CardDescription>
          Periksa data sebelum membuat kunjungan.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-xs text-muted-foreground">Tipe Pasien</p>

          <p className="mt-1 font-medium">
            {patientType === "existing" ? "Pasien Lama" : "Pasien Baru"}
          </p>
        </div>

        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-xs text-muted-foreground">Pasien</p>

          <p className="mt-1 font-medium">
            {patientType === "existing"
              ? selectedPatient?.name || "Belum dipilih"
              : patientName || "Belum diisi"}
          </p>

          {patientType === "existing" && selectedPatient && (
            <p className="mt-1 text-xs text-muted-foreground">
              {selectedPatient.medical_record_number ?? "No. RM belum tersedia"}
            </p>
          )}
        </div>

        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-xs text-muted-foreground">Department</p>

          <p className="mt-1 font-medium">
            {department?.name || "Belum dipilih"}
          </p>

          {department && (
            <p className="mt-1 text-xs text-muted-foreground">
              {department.code}
            </p>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={disabled}>
          {submitting ? (
            <>
              <Spinner />
              Mendaftarkan...
            </>
          ) : (
            <>
              <UserPlusIcon />
              Daftarkan Kunjungan
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Nomor antrian akan dibuat otomatis setelah registrasi berhasil.
        </p>
      </CardContent>
    </Card>
  )
}
