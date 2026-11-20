"use client"

import { useMemo, useState } from "react"
import { SearchIcon, XIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DataTable,
  createDataTableColumnHelper,
} from "@/components/ui/data-table"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"

import { PatientDetailSheet } from "@/components/receptionist/patients/patient-detail-sheet"

import { usePatientSearch } from "@/hooks/use-patient-search"

import { formatDate, genderLabel } from "@/lib/reception/format"

import type { Patient } from "@/types/reception"

// Client-side pagination needs the full result set for the current search.
const PER_PAGE = 200

const columnHelper = createDataTableColumnHelper<Patient>()

export function PatientDirectory() {
  const [query, setQuery] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(
    null
  )

  const { results, total, searching, error } = usePatientSearch(query, {
    enableEmptyQuery: true,
    perPage: PER_PAGE,
    refreshKey,
  })

  function handleQueryChange(value: string) {
    setQuery(value)
  }

  function retry() {
    setRefreshKey((current) => current + 1)
  }

  const showSkeleton = searching && results.length === 0

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("name", {
          header: "Pasien",
          cell: ({ row }) => (
            <div>
              <p className="font-medium">{row.original.name}</p>

              <p className="text-xs text-muted-foreground">
                {row.original.mrn ?? "Tanpa MRN"}
              </p>
            </div>
          ),
        }),
        columnHelper.accessor("nik", {
          header: "NIK",
          cell: ({ row }) => (
            <span className="font-mono text-xs">
              {row.original.nik ?? "-"}
            </span>
          ),
        }),
        columnHelper.accessor("date_of_birth", {
          header: "Tanggal Lahir",
          cell: ({ row }) => formatDate(row.original.date_of_birth),
        }),
        columnHelper.accessor("gender", {
          header: "Jenis Kelamin",
          cell: ({ row }) => genderLabel(row.original.gender),
        }),
        columnHelper.accessor("phone", {
          header: "Telepon",
          cell: ({ row }) => row.original.phone ?? "-",
        }),
        columnHelper.display({
          id: "actions",
          header: () => <span className="block text-right">Aksi</span>,
          cell: ({ row }) => (
            <div className="text-right">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPatientId(row.original.id)}
              >
                Detail
              </Button>
            </div>
          ),
        }),
      ]),
    []
  )

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-base">Direktori Pasien</CardTitle>

              <CardDescription>
                Cari pasien berdasarkan nama, No. RM, NIK, atau telepon.
              </CardDescription>
            </div>

            <Badge variant="outline">{total} pasien</Badge>
          </div>

          <div className="relative mt-3 max-w-lg">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              placeholder="Cari nama, No. RM, NIK, atau telepon..."
              className="h-10 pr-10 pl-9"
              autoComplete="off"
            />

            <div className="absolute top-1/2 right-2 -translate-y-1/2">
              {searching ? (
                <Spinner className="size-4 text-muted-foreground" />
              ) : query ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleQueryChange("")}
                  aria-label="Hapus pencarian"
                >
                  <XIcon />
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {error ? (
            <div className="flex flex-col items-center gap-3 p-8 text-center">
              <p className="text-sm text-destructive">{error}</p>

              <Button variant="outline" onClick={retry}>
                Coba Lagi
              </Button>
            </div>
          ) : showSkeleton ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium">Pasien tidak ditemukan</p>

              <p className="mt-1 text-xs text-muted-foreground">
                Coba kata kunci lain atau periksa ejaan.
              </p>
            </div>
          ) : (
            <div className="p-0">
              <DataTable
                columns={columns}
                data={results}
                getRowId={(row) => String(row.id)}
                emptyMessage="Pasien tidak ditemukan."
              />
            </div>
          )}
        </CardContent>
      </Card>

      <PatientDetailSheet
        patientId={selectedPatientId}
        open={selectedPatientId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPatientId(null)
          }
        }}
      />
    </>
  )
}
