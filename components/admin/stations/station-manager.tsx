"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { PencilIcon, PlusIcon } from "lucide-react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { StationFormDialog } from "@/components/admin/stations/station-form-dialog"

import { useTableQuery } from "@/hooks/use-table-query"
import { STATION_TYPES, stationTypeLabel } from "@/lib/reception/format"

import type { AdminStation } from "@/types/admin"
import type { Department } from "@/types/reception"
import type { TableQueryState } from "@/hooks/use-table-query"

const columnHelper = createDataTableColumnHelper<AdminStation>()


export function StationManager({
  rows,
  total,
  lastPage,
  departments,
  state,
}: {
  rows: AdminStation[]
  total: number
  lastPage: number
  departments: Department[]
  filters: Record<string, string>
  state: TableQueryState
}) {
  const router = useRouter()
  const tq = useTableQuery(state)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AdminStation | null>(null)

  const departmentFilter = state.filters?.department_id ?? "all"
  const typeFilter = state.filters?.type ?? "all"
  const parsedDepartment = Number(departmentFilter)
  const defaultDepartmentId = Number.isInteger(parsedDepartment)
    ? parsedDepartment
    : null

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
          header: "Departemen",
          cell: ({ row }) =>
            row.original.department?.name ??
            departments.find((d) => d.id === row.original.department_id)
              ?.name ??
            "-",
          enableSorting: false,
        }),
        columnHelper.accessor("queue_prefix", {
          header: "Prefix",
          cell: ({ row }) => (
            <span className="font-mono text-xs">
              {row.original.queue_prefix}
            </span>
          ),
          enableSorting: false,
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
          enableSorting: false,
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
                Titik pelayanan yang terhubung dengan departemen dan workflow.
              </CardDescription>
            </div>

            <Button onClick={openCreate}>
              <PlusIcon />
              Tambah Station
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={rows}
            getRowId={(station) => String(station.id)}
            emptyMessage="Station tidak ditemukan."
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
            searchPlaceholder="Cari kode atau nama station..."
            toolbar={
              <>
                <Select
                  value={departmentFilter}
                  onValueChange={(value) =>
                    tq.setFilter(
                      "department_id",
                      !value || value === "all" ? null : value
                    )
                  }
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">Semua Departemen</SelectItem>

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

                <Select
                  value={typeFilter}
                  onValueChange={(value) =>
                    tq.setFilter(
                      "type",
                      !value || value === "all" ? null : value
                    )
                  }
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>

                    {STATION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {stationTypeLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            }
          />
        </CardContent>
      </Card>

      <StationFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        station={editing}
        departments={departments}
        defaultDepartmentId={defaultDepartmentId}
        onSaved={() => router.refresh()}
      />
    </>
  )
}
