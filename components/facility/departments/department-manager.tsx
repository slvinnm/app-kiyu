"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PencilIcon, PlusIcon } from "lucide-react"

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

import { DepartmentFormDialog } from "@/components/facility/departments/department-form-dialog"

import { useTableQuery } from "@/hooks/use-table-query"

import type { Department } from "@/types/reception"
import type { TableQueryState } from "@/hooks/use-table-query"

const columnHelper = createDataTableColumnHelper<Department>()

export function DepartmentManager({
  rows,
  total,
  lastPage,
  state,
  detailPathPrefix = "/facility/departments",
  showCreate = true,
}: {
  rows: Department[]
  total: number
  lastPage: number
  filters: Record<string, string>
  state: TableQueryState
  /**
   * Base path for a row's "Detail" action; the id is appended. A plain string
   * (not a function) because this is a Client Component rendered from a Server
   * Component, and functions cannot cross that boundary.
   */
  detailPathPrefix?: string
  /** Hide the create button where the surface is read-only. */
  showCreate?: boolean
}) {
  const router = useRouter()
  const tq = useTableQuery(state)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)

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
          enableSorting: false,
        }),
        columnHelper.display({
          id: "actions",
          header: () => <span className="block text-right">Aksi</span>,
          cell: ({ row }) => (
            <div className="flex justify-end gap-2">
              <Link
                href={`${detailPathPrefix}/${row.original.id}/detail`}
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                })}
              >
                Detail
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
          enableSorting: false,
        }),
      ]),
    [detailPathPrefix]
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
              <CardTitle className="text-base">Daftar Departemen</CardTitle>

              <CardDescription>
                Kelola unit pelayanan beserta status aktifnya.
              </CardDescription>
            </div>

            {showCreate && (
              <Button onClick={openCreate}>
                <PlusIcon />
                Tambah Departemen
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={rows}
            getRowId={(department) => String(department.id)}
            emptyMessage="Departemen tidak ditemukan."
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
            searchPlaceholder="Cari kode atau nama departemen..."
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
