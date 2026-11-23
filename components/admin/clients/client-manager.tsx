"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { PencilIcon, PlusIcon } from "lucide-react"

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

import { PatientFormDialog } from "@/components/admin/clients/client-form-dialog"

import { useTableQuery } from "@/hooks/use-table-query"
import { formatDate, genderLabel } from "@/lib/reception/format"

import type { Patient } from "@/types/reception"
import type { TableQueryState } from "@/hooks/use-table-query"

const columnHelper = createDataTableColumnHelper<Patient>()

export function PatientManager({
  rows,
  total,
  lastPage,
  state,
}: {
  rows: Patient[]
  total: number
  lastPage: number
  filters: Record<string, string>
  state: TableQueryState
}) {
  const router = useRouter()
  const tq = useTableQuery(state)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Patient | null>(null)

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("name", {
          header: "Nama",
          cell: ({ row }) => (
            <span className="font-medium">{row.original.name}</span>
          ),
        }),
        columnHelper.accessor("mrn", {
          header: "MRN",
          cell: ({ row }) => (
            <span className="font-mono text-xs">{row.original.mrn ?? "-"}</span>
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
          cell: ({ row }) => formatDate(row.original.date_of_birth),
          enableSorting: false,
        }),
        columnHelper.accessor("gender", {
          header: "Gender",
          cell: ({ row }) => genderLabel(row.original.gender),
          enableSorting: false,
        }),
        columnHelper.accessor("phone", {
          header: "Telepon",
          cell: ({ row }) => row.original.phone ?? "-",
          enableSorting: false,
        }),
        columnHelper.display({
          id: "actions",
          header: () => <span className="block text-right">Aksi</span>,
          cell: ({ row }) => (
            <div className="text-right">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditing(row.original)
                  setDialogOpen(true)
                }}
              >
                <PencilIcon />
                Edit
              </Button>
            </div>
          ),
          enableSorting: false,
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
                Cari, tambah, dan perbarui data identitas pasien.
              </CardDescription>
            </div>

            <Button onClick={openCreate}>
              <PlusIcon />
              Tambah Pasien
            </Button>
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
            searchPlaceholder="Cari nama, MRN, NIK, atau telepon..."
          />
        </CardContent>
      </Card>

      <PatientFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        patient={editing}
        onSaved={() => router.refresh()}
      />
    </>
  )
}
