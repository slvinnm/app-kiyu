"use client"

import { useState } from "react"
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
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { PatientDetailSheet } from "@/components/receptionist/patients/patient-detail-sheet"

import { usePatientSearch } from "@/hooks/use-patient-search"

import { formatDate, genderLabel } from "@/lib/reception/format"

const PER_PAGE = 20

export function PatientDirectory() {
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(
    null
  )

  const { results, pagination, searching, error } = usePatientSearch(query, {
    enableEmptyQuery: true,
    page,
    perPage: PER_PAGE,
    refreshKey,
  })

  function handleQueryChange(value: string) {
    setQuery(value)
    setPage(1)
  }

  function retry() {
    setRefreshKey((current) => current + 1)
  }

  const showSkeleton = searching && results.length === 0

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

            <Badge variant="outline">
              {pagination?.total ?? 0} pasien
            </Badge>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pasien</TableHead>

                  <TableHead>NIK</TableHead>

                  <TableHead>Tanggal Lahir</TableHead>

                  <TableHead>Jenis Kelamin</TableHead>

                  <TableHead>Telepon</TableHead>

                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {results.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{patient.name}</p>

                        <p className="text-xs text-muted-foreground">
                          {patient.mrn ?? "Tanpa MRN"}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell className="font-mono text-xs">
                      {patient.nik ?? "-"}
                    </TableCell>

                    <TableCell>{formatDate(patient.date_of_birth)}</TableCell>

                    <TableCell>{genderLabel(patient.gender)}</TableCell>

                    <TableCell>{patient.phone ?? "-"}</TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPatientId(patient.id)}
                      >
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {pagination && pagination.last_page > 1 && (
        <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            Halaman {pagination.current_page} dari {pagination.last_page} ·{" "}
            {pagination.total} pasien
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={pagination.current_page <= 1 || searching}
            >
              Sebelumnya
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPage((current) =>
                  Math.min(pagination.last_page, current + 1)
                )
              }
              disabled={
                pagination.current_page >= pagination.last_page || searching
              }
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}

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
