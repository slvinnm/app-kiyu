"use client"

import { useMemo, useState } from "react"

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

import { PatientDetailSheet } from "@/components/receptionist/clients/client-detail-sheet"

import { useTableQuery } from "@/hooks/use-table-query"

import { formatDate, genderLabel } from "@/lib/reception/format"

import type { TableQueryState } from "@/hooks/use-table-query"
import type { Patient } from "@/types/reception"

const columnHelper = createDataTableColumnHelper<Patient>()

export function PatientDirectory({
  rows,
  total,
  lastPage,
  state,
}: {
  rows: Patient[]
  total: number
  lastPage: number
  state: TableQueryState
}) {
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(
    null
  )

  const tq = useTableQuery(state)

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
            <span className="font-mono text-xs">{row.original.nik ?? "-"}</span>
          ),
        }),
        columnHelper.accessor("date_of_birth", {
          header: "Tanggal Lahir",
          enableSorting: false,
          cell: ({ row }) => formatDate(row.original.date_of_birth),
        }),
        columnHelper.accessor("gender", {
          header: "Jenis Kelamin",
          enableSorting: false,
          cell: ({ row }) => genderLabel(row.original.gender),
        }),
        columnHelper.accessor("phone", {
          header: "Telepon",
          enableSorting: false,
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
        </CardHeader>

        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={rows}
            getRowId={(row) => String(row.id)}
            emptyMessage="Pasien tidak ditemukan."
            pageCount={lastPage}
            pageIndex={state.page - 1}
            pageSize={state.perPage}
            total={total}
            sorting={tq.sorting}
            onSortingChange={tq.setSorting}
            onPageChange={tq.setPageIndex}
            onPageSizeChange={tq.setPerPage}
            searchValue={tq.searchInput}
            onSearchChange={tq.setSearchInput}
            searching={tq.pending}
            searchPlaceholder="Cari nama, No. RM, NIK, atau telepon…"
          />
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
