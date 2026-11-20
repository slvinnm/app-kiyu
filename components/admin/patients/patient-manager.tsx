"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { PencilIcon, PlusIcon, SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  DataTable,
  createDataTableColumnHelper,
} from "@/components/ui/data-table"

import { PatientFormDialog } from "@/components/admin/patients/patient-form-dialog"

import { formatDate, genderLabel } from "@/lib/reception/format"

import type { Patient } from "@/types/reception"

const columnHelper = createDataTableColumnHelper<Patient>()

export function PatientManager({
  patients,
  search,
}: {
  patients: Patient[]
  search: string
}) {
  const router = useRouter()
  const [query, setQuery] = useState(search)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Patient | null>(null)

  function applySearch() {
    const keyword = query.trim()
    router.push(
      keyword
        ? `/admin/patients?search=${encodeURIComponent(keyword)}`
        : "/admin/patients"
    )
  }

  function resetSearch() {
    setQuery("")
    router.push("/admin/patients")
  }

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
        }),
        columnHelper.accessor("gender", {
          header: "Gender",
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

          <form
            className="mt-3 flex max-w-lg gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              applySearch()
            }}
          >
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari nama, MRN, NIK, atau telepon..."
                className="h-9 pl-9"
              />
            </div>

            <Button type="submit">Cari</Button>

            <Button type="button" variant="outline" onClick={resetSearch}>
              Reset
            </Button>
          </form>
        </CardHeader>

        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={patients}
            getRowId={(row) => String(row.id)}
            emptyMessage="Pasien tidak ditemukan."
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
