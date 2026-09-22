import { CheckIcon, SearchIcon, SearchXIcon, UserIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
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
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold tracking-tight">
          Cari Pasien
        </CardTitle>

        <CardDescription className="text-xs text-muted-foreground">
          Cari berdasarkan nama, nomor rekam medis, NIK, atau nomor telepon.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Ketik Nama / No. RM / NIK / No. HP..."
            className="h-10 pr-9 pl-9 text-sm"
          />

          {searching && (
            <Spinner className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
          )}
        </div>

        {results.length > 0 && (
          <div className="space-y-2">
            <p className="px-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              Hasil Pencarian ({results.length})
            </p>

            <div className="space-y-1.5">
              {results.map((patient) => {
                const isSelected = selectedPatient?.id === patient.id

                return (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => onSelect(patient)}
                    className={`group relative flex w-full items-center justify-between rounded-lg border p-3 text-left transition-all hover:border-foreground/30 hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                      isSelected
                        ? "border-foreground bg-muted/60 shadow-xs"
                        : "bg-card"
                    }`}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {patient.name}
                      </p>

                      <p className="font-mono text-xs text-muted-foreground">
                        RM:{" "}
                        {patient.medical_record_number ?? "Belum ada No. RM"}
                      </p>
                    </div>

                    <div className="ml-4 flex shrink-0 items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {patient.phone ?? "-"}
                      </span>

                      {isSelected && (
                        <div className="flex size-4 items-center justify-center rounded-full bg-foreground text-background">
                          <CheckIcon className="size-2.5" />
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {search && !searching && results.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 p-6 text-center">
            <div className="mb-2 flex size-9 items-center justify-center rounded-full border bg-muted text-muted-foreground">
              <SearchXIcon className="size-4" />
            </div>

            <p className="text-sm font-medium text-foreground">
              Pasien tidak ditemukan
            </p>

            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Tidak ada hasil untuk kata kunci &quot;{search}&quot;. Periksa
              kembali nama, NIK, atau nomor RM.
            </p>
          </div>
        )}

        {selectedPatient && (
          <div className="space-y-3 rounded-lg border bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full border bg-muted text-foreground">
                  <UserIcon className="size-4" />
                </div>

                <div className="min-w-0 space-y-0.5">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {selectedPatient.name}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    RM:{" "}
                    {selectedPatient.medical_record_number ?? "Belum tersedia"}
                  </p>
                </div>
              </div>

              <Badge
                variant="outline"
                className="shrink-0 text-[11px] font-medium"
              >
                Terpilih
              </Badge>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-md bg-muted/20 p-3 text-xs">
              <div>
                <span className="block text-[10px] font-medium text-muted-foreground uppercase">
                  Tanggal Lahir
                </span>
                <span className="font-mono font-medium text-foreground">
                  {selectedPatient.date_of_birth ?? "-"}
                </span>
              </div>

              <div>
                <span className="block text-[10px] font-medium text-muted-foreground uppercase">
                  Jenis Kelamin
                </span>
                <span className="font-medium text-foreground">
                  {selectedPatient.gender === "male"
                    ? "Laki-laki"
                    : selectedPatient.gender === "female"
                      ? "Perempuan"
                      : "-"}
                </span>
              </div>

              <div>
                <span className="block text-[10px] font-medium text-muted-foreground uppercase">
                  No. Telepon
                </span>
                <span className="font-mono font-medium text-foreground">
                  {selectedPatient.phone ?? "-"}
                </span>
              </div>

              <div>
                <span className="block text-[10px] font-medium text-muted-foreground uppercase">
                  Email
                </span>
                <span className="block truncate font-medium text-foreground">
                  {selectedPatient.email ?? "-"}
                </span>
              </div>

              <div className="col-span-2">
                <span className="block text-[10px] font-medium text-muted-foreground uppercase">
                  Alamat
                </span>
                <span className="font-medium text-foreground">
                  {selectedPatient.address ?? "-"}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
