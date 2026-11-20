"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PencilIcon, PlusIcon, SearchIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
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

import { DepartmentFormDialog } from "@/components/admin/departments/department-form-dialog"

import type { Department } from "@/types/reception"

const columnHelper = createDataTableColumnHelper<Department>()

export function DepartmentManager({
  departments,
}: {
  departments: Department[]
}) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()

    if (!keyword) {
      return departments
    }

    return departments.filter(
      (department) =>
        department.name.toLowerCase().includes(keyword) ||
        department.code.toLowerCase().includes(keyword)
    )
  }, [departments, query])

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("code", {
          header: "Kode",
          cell: ({ row }) => (
            <span className="font-mono text-xs">{row.original.code}</span>
          ),
        }),
        columnHelper.accessor("name", {
          header: "Nama",
          cell: ({ row }) => (
            <span className="font-medium">{row.original.name}</span>
          ),
        }),
        columnHelper.display({
          id: "stations",
          header: "Station",
          cell: ({ row }) => row.original.stations?.length ?? 0,
        }),
        columnHelper.accessor("is_active", {
          header: "Status",
          cell: ({ row }) => (
            <Badge variant={row.original.is_active ? "default" : "outline"}>
              {row.original.is_active ? "Aktif" : "Nonaktif"}
            </Badge>
          ),
        }),
        columnHelper.display({
          id: "kiosk",
          header: "Kiosk",
          cell: ({ row }) => (
            <Badge
              variant={
                row.original.display_in_kiosk === false
                  ? "outline"
                  : "secondary"
              }
            >
              {row.original.display_in_kiosk === false ? "Internal" : "Tampil"}
            </Badge>
          ),
        }),
        columnHelper.display({
          id: "actions",
          header: () => <span className="block text-right">Aksi</span>,
          cell: ({ row }) => (
            <div className="flex justify-end gap-2">
              <Link
                href={`/admin/stations?department_id=${row.original.id}`}
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                })}
              >
                Station
              </Link>

              <Button
                variant="outline"
                size="sm"
                onClick={() => openEdit(row.original)}
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

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(department: Department) {
    setEditing(department)
    setDialogOpen(true)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-base">Daftar Poli</CardTitle>

              <CardDescription>
                Kelola unit pelayanan beserta status aktifnya.
              </CardDescription>
            </div>

            <Button onClick={openCreate}>
              <PlusIcon />
              Tambah Poli
            </Button>
          </div>

          <div className="relative mt-3 max-w-sm">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari kode atau nama poli..."
              className="h-9 pl-9"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filtered}
            getRowId={(department) => String(department.id)}
            emptyMessage="Poli tidak ditemukan."
          />
        </CardContent>
      </Card>

      <DepartmentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        department={editing}
        onSaved={() => router.refresh()}
      />
    </>
  )
}
