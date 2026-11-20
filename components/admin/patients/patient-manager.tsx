"use client"

import { useState } from "react"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { AdminPaginationLinks } from "@/components/admin/admin-pagination"
import { PatientFormDialog } from "@/components/admin/patients/patient-form-dialog"

import { formatDate, genderLabel } from "@/lib/reception/format"

import type { Paginated, Patient } from "@/types/reception"

export function PatientManager({
  patients,
  pagination,
  search,
}: {
  patients: Patient[]
  pagination: Paginated<Patient>
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

  function openEdit(patient: Patient) {
    setEditing(patient)
    setDialogOpen(true)
  }

  function hrefFor(page: number): string {
    const params = new URLSearchParams()

    if (search) params.set("search", search)
    if (page > 1) params.set("page", String(page))

    const text = params.toString()

    return text ? `/admin/patients?${text}` : "/admin/patients"
  }

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>

                <TableHead>MRN</TableHead>

                <TableHead>NIK</TableHead>

                <TableHead>Tanggal Lahir</TableHead>

                <TableHead>Gender</TableHead>

                <TableHead>Telepon</TableHead>

                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {patients.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="p-8 text-center text-sm text-muted-foreground"
                  >
                    Pasien tidak ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">
                      {patient.name}
                    </TableCell>

                    <TableCell className="font-mono text-xs">
                      {patient.mrn ?? "-"}
                    </TableCell>

                    <TableCell className="font-mono text-xs">
                      {patient.nik ?? "-"}
                    </TableCell>

                    <TableCell>
                      {formatDate(patient.date_of_birth)}
                    </TableCell>

                    <TableCell>{genderLabel(patient.gender)}</TableCell>

                    <TableCell>{patient.phone ?? "-"}</TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(patient)}
                      >
                        <PencilIcon />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AdminPaginationLinks
        currentPage={pagination.current_page}
        lastPage={pagination.last_page}
        total={pagination.total}
        hrefFor={hrefFor}
      />

      <PatientFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        patient={editing}
        onSaved={() => router.refresh()}
      />
    </>
  )
}
