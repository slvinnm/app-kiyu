import { CheckCircle2Icon, SearchIcon } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

import type { Patient } from "@/types/reception"

type PatientSearchProps = {
  search: string
  results: Patient[]
  selectedPatient: Patient | null
  searching: boolean
  onSearchChange: (value: string) => void
  onSelect: (patient: Patient) => void
}

export function PatientSearch({
  search,
  results,
  selectedPatient,
  searching,
  onSearchChange,
  onSelect,
}: PatientSearchProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Cari Pasien</CardTitle>

        <CardDescription>
          Cari berdasarkan nama, nomor rekam medis, NIK, atau nomor telepon.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Nama / No. RM / NIK / No. HP"
            className="pr-9 pl-9"
          />

          {searching && (
            <Spinner className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
          )}
        </div>

        {results.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Hasil pencarian
            </p>

            {results.map((patient) => (
              <button
                key={patient.id}
                type="button"
                onClick={() => onSelect(patient)}
                className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted ${
                  selectedPatient?.id === patient.id
                    ? "border-primary bg-primary/5"
                    : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{patient.name}</p>

                  <p className="text-xs text-muted-foreground">
                    {patient.medical_record_number ?? "No. RM belum tersedia"}
                  </p>
                </div>

                <span className="ml-4 shrink-0 text-xs text-muted-foreground">
                  {patient.phone ?? "-"}
                </span>
              </button>
            ))}
          </div>
        )}

        {search && !searching && results.length === 0 && (
          <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            Pasien tidak ditemukan.
          </div>
        )}

        {selectedPatient && (
          <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CheckCircle2Icon className="size-5" />
              </div>

              <div className="min-w-0">
                <p className="truncate font-medium">{selectedPatient.name}</p>

                <p className="text-xs text-muted-foreground">
                  {selectedPatient.medical_record_number ??
                    "No. RM belum tersedia"}
                </p>
              </div>

              <Badge variant="outline" className="ml-auto shrink-0">
                Terpilih
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Tanggal Lahir</p>

                <p className="font-medium">
                  {selectedPatient.date_of_birth ?? "-"}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Jenis Kelamin</p>

                <p className="font-medium">
                  {selectedPatient.gender === "male"
                    ? "Laki-laki"
                    : selectedPatient.gender === "female"
                      ? "Perempuan"
                      : "-"}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">No. Telepon</p>

                <p className="font-medium">{selectedPatient.phone ?? "-"}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Email</p>

                <p className="truncate font-medium">
                  {selectedPatient.email ?? "-"}
                </p>
              </div>

              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Alamat</p>

                <p className="font-medium">{selectedPatient.address ?? "-"}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
