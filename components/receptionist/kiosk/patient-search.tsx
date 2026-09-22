import { SearchIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import type { Patient } from "@/types/reception"

type PatientSearchProps = {
  search: string
  results: Patient[]
  selected: Patient | null
  searching: boolean
  onSearchChange: (value: string) => void
  onSelect: (patient: Patient) => void
}

export function PatientSearch({
  search,
  results,
  selected,
  searching,
  onSearchChange,
  onSelect,
}: PatientSearchProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Cari Pasien</CardTitle>

        <CardDescription>
          Cari pasien yang akan dihubungkan dengan queue acquisition ini.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Nama / No. RM / NIK / No. HP"
            className="pr-9 pl-9"
            autoFocus
          />

          {searching && (
            <Spinner className="absolute top-1/2 right-3 size-4 -translate-y-1/2" />
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Gunakan informasi yang tersedia dari pasien untuk menemukan data yang
          sesuai.
        </p>

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
                className="flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors hover:bg-muted"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{patient.name}</p>

                  <p className="mt-1 text-xs text-muted-foreground">
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
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-sm font-medium">Pasien tidak ditemukan</p>

            <p className="mt-1 text-xs text-muted-foreground">
              Periksa kembali nama, nomor RM, NIK, atau nomor telepon.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
