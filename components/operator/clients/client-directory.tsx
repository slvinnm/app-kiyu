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

import { CustomerDetailSheet } from "@/components/operator/clients/client-detail-sheet"

import { useTableQuery } from "@/hooks/use-table-query"


import type { TableQueryState } from "@/hooks/use-table-query"
import type { Customer } from "@/types/reception"

const columnHelper = createDataTableColumnHelper<Customer>()

export function CustomerDirectory({
  rows,
  total,
  lastPage,
  state,
}: {
  rows: Customer[]
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
          header: "Pelanggan",
          cell: ({ row }) => (
            <div>
              <p className="font-medium">{row.original.name}</p>

              <p className="text-xs text-muted-foreground">
                {row.original.email ?? "Tanpa email"}
              </p>
            </div>
          ),
        }),
        columnHelper.accessor("phone", {
          header: "Telepon",
          enableSorting: false,
          cell: ({ row }) => row.original.phone ?? "-",
        }),
        columnHelper.accessor("address", {
          header: "Alamat",
          enableSorting: false,
          cell: ({ row }) => (
            <span className="text-sm">{row.original.address ?? "-"}</span>
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
              <CardTitle className="text-base">Direktori Pelanggan</CardTitle>

              <CardDescription>
                Cari pelanggan berdasarkan nama, Telepon, email, atau telepon.
              </CardDescription>
            </div>

            <Badge variant="outline">{total} pelanggan</Badge>
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
            searchPlaceholder="Cari nama, email, atau telepon…"
          />
        </CardContent>
      </Card>

      <CustomerDetailSheet
        customerId={selectedPatientId}
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
