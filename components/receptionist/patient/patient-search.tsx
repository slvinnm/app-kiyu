"use client"

import { SearchIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"

import { PatientSummary } from "@/components/receptionist/patient/patient-summary"

import type { Patient } from "@/types/reception"

export function PatientSearch({
  search,
  results,
  selected,
  searching,
  error,
  minLength = 2,
  onSearchChange,
  onSelect,
  onClear,
}: {
  search: string
  results: Patient[]
  selected: Patient | null
  searching: boolean
  error: string | null
  minLength?: number
  onSearchChange: (value: string) => void
  onSelect: (patient: Patient) => void
  onClear?: () => void
}) {
  if (selected) {
    return (
      <div className="space-y-3">
        <Label>Pasien Terpilih</Label>

        <PatientSummary
          patient={selected}
          action={
            onClear ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClear}
              >
                Ganti
              </Button>
            ) : null
          }
        />
      </div>
    )
  }

  const keyword = search.trim()
  const canSearch = keyword.length >= minLength

  return (
    <div className="space-y-3">
      <Label htmlFor="patient-search">Cari Pasien</Label>

      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          id="patient-search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Cari nama, No. RM, NIK, atau telepon..."
          className="h-11 pr-10 pl-9"
          autoComplete="off"
        />

        <div className="absolute top-1/2 right-2 -translate-y-1/2">
          {searching ? (
            <Spinner className="size-4 text-muted-foreground" />
          ) : search ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onSearchChange("")}
              aria-label="Hapus pencarian"
            >
              <XIcon />
            </Button>
          ) : null}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!searching && canSearch && results.length === 0 && !error && (
        <div className="rounded-xl border p-5 text-center">
          <p className="text-sm font-medium">Pasien tidak ditemukan</p>

          <p className="mt-1 text-xs text-muted-foreground">
            Anda dapat mendaftarkan pasien sebagai pasien baru.
          </p>
        </div>
      )}

      {results.length > 0 && (
        <div className="overflow-hidden rounded-xl border">
          {results.map((patient) => (
            <button
              key={patient.id}
              type="button"
              onClick={() => onSelect(patient)}
              className="flex w-full items-center gap-3 border-b p-4 text-left transition-colors last:border-b-0 hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">{patient.name}</p>

                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>{patient.mrn ?? "Tanpa MRN"}</span>

                  {patient.nik && <span>NIK {patient.nik}</span>}

                  {patient.phone && <span>{patient.phone}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
