"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { PencilIcon, PlusIcon, SearchIcon } from "lucide-react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { StationFormDialog } from "@/components/admin/stations/station-form-dialog"

import { stationTypeLabel } from "@/lib/reception/format"

import type { AdminStation } from "@/types/admin"
import type { Department } from "@/types/reception"

const columnHelper = createDataTableColumnHelper<AdminStation>()

export function StationManager({
  stations,
  departments,
  defaultDepartmentId,
}: {
  stations: AdminStation[]
  departments: Department[]
  defaultDepartmentId: number | null
}) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState(
    defaultDepartmentId ? String(defaultDepartmentId) : "all"
  )
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AdminStation | null>(null)

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()

    return stations.filter((station) => {
      const matchesDepartment =
        departmentFilter === "all" ||
        station.department_id === Number(departmentFilter)

      if (!matchesDepartment) {
        return false
      }

      if (!keyword) {
        return true
      }

      return (
        station.name.toLowerCase().includes(keyword) ||
        station.code.toLowerCase().includes(keyword)
      )
    })
  }, [stations, query, departmentFilter])

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
        columnHelper.accessor("type", {
          header: "Tipe",
          cell: ({ row }) => (
            <Badge variant="outline">
              {stationTypeLabel(row.original.type)}
            </Badge>
          ),
        }),
        columnHelper.display({
          id: "department",
          header: "Poli",
          cell: ({ row }) =>
            row.original.department?.name ??
            departments.find((d) => d.id === row.original.department_id)
              ?.name ??
            "-",
        }),
        columnHelper.accessor("queue_prefix", {
          header: "Prefix",
          cell: ({ row }) => (
            <span className="font-mono text-xs">
              {row.original.queue_prefix}
            </span>
          ),
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
          id: "actions",
          header: () => <span className="block text-right">Aksi</span>,
          cell: ({ row }) => (
            <div className="text-right">
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
    [departments]
  )

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(station: AdminStation) {
    setEditing(station)
    setDialogOpen(true)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-base">Daftar Station</CardTitle>

              <CardDescription>
                Titik pelayanan yang terhubung dengan poli dan workflow.
              </CardDescription>
            </div>

            <Button onClick={openCreate}>
              <PlusIcon />
              Tambah Station
            </Button>
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <div className="relative max-w-sm flex-1">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari kode atau nama station..."
                className="h-9 pl-9"
              />
            </div>

            <Select
              value={departmentFilter}
              onValueChange={(value) =>
                setDepartmentFilter(value ?? "all")
              }
            >
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">Semua Poli</SelectItem>

                {departments.map((department) => (
                  <SelectItem
                    key={department.id}
                    value={String(department.id)}
                  >
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filtered}
            getRowId={(station) => String(station.id)}
            emptyMessage="Station tidak ditemukan."
          />
        </CardContent>
      </Card>

      <StationFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        station={editing}
        departments={departments}
        defaultDepartmentId={
          departmentFilter === "all" ? null : Number(departmentFilter)
        }
        onSaved={() => router.refresh()}
      />
    </>
  )
}
