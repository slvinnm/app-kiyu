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

import { CustomerFormDialog } from "@/components/admin/clients/client-form-dialog"

import { useTableQuery } from "@/hooks/use-table-query"

import type { Customer } from "@/types/reception"
import type { TableQueryState } from "@/hooks/use-table-query"

const columnHelper = createDataTableColumnHelper<Customer>()

export function CustomerManager({
  rows,
  total,
  lastPage,
  state,
}: {
  rows: Customer[]
  total: number
  lastPage: number
  filters: Record<string, string>
  state: TableQueryState
}) {
  const router = useRouter()
  const tq = useTableQuery(state)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)

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
        columnHelper.accessor("phone", {
          header: "Telepon",
          cell: ({ row }) => row.original.phone ?? "-",
          enableSorting: false,
        }),
        columnHelper.accessor("email", {
          header: "Email",
          cell: ({ row }) => row.original.email ?? "-",
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
              <CardTitle className="text-base">Direktori Pelanggan</CardTitle>

              <CardDescription>
                Cari, tambah, dan perbarui data kontak pelanggan.
              </CardDescription>
            </div>

            <Button onClick={openCreate}>
              <PlusIcon />
              Tambah Pelanggan
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={rows}
            getRowId={(row) => String(row.id)}
            emptyMessage="Pelanggan tidak ditemukan."
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
            searchPlaceholder="Cari nama, email, atau telepon..."
          />
        </CardContent>
      </Card>

      <CustomerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customer={editing}
        onSaved={() => router.refresh()}
      />
    </>
  )
}
