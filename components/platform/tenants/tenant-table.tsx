"use client"

import Link from "next/link"
import { useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DataTable,
  createDataTableColumnHelper,
} from "@/components/ui/data-table"

import { useTableQuery } from "@/hooks/use-table-query"
import { formatDateTime } from "@/lib/reception/format"

import type { TableQueryState } from "@/hooks/use-table-query"
import type { TenantRow, TenantStatus } from "@/types/platform"

const columnHelper = createDataTableColumnHelper<TenantRow>()

const STATUS_VARIANT: Record<
  TenantStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  ACTIVE: "secondary",
  PENDING: "outline",
  SUSPENDED: "destructive",
  CANCELLED: "outline",
}

export function TenantTable({
  rows,
  total,
  lastPage,
  state,
}: {
  rows: TenantRow[]
  total: number
  lastPage: number
  state: TableQueryState
}) {
  const tq = useTableQuery(state)

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("name", {
          header: "Organisasi",
          cell: ({ row }) => (
            <div className="flex flex-col">
              <Link
                href={`/platform/tenants/${row.original.id}`}
                className="font-medium hover:underline"
              >
                {row.original.name}
              </Link>
              <span className="text-xs text-muted-foreground">
                {row.original.slug}
              </span>
            </div>
          ),
        }),
        columnHelper.accessor("status", {
          header: "Status",
          cell: ({ row }) => (
            <Badge variant={STATUS_VARIANT[row.original.status]}>
              {row.original.status}
            </Badge>
          ),
        }),
        columnHelper.accessor("facilities_count", {
          header: "Fasilitas",
          cell: ({ row }) => (
            <span className="tabular-nums">
              {row.original.facilities_count ?? 0}
            </span>
          ),
        }),
        columnHelper.accessor("users_count", {
          header: "Pengguna",
          cell: ({ row }) => (
            <span className="tabular-nums">
              {row.original.users_count ?? 0}
            </span>
          ),
        }),
        columnHelper.display({
          id: "devices",
          header: "Perangkat",
          cell: ({ row }) => (
            <span className="text-xs text-muted-foreground tabular-nums">
              {row.original.kiosk_devices_count ?? 0} kiosk ·{" "}
              {row.original.display_devices_count ?? 0} display
            </span>
          ),
        }),
        columnHelper.accessor("created_at", {
          header: "Terdaftar",
          cell: ({ row }) => (
            <span className="text-xs whitespace-nowrap text-muted-foreground">
              {formatDateTime(row.original.created_at)}
            </span>
          ),
        }),
        columnHelper.display({
          id: "actions",
          header: "",
          cell: ({ row }) => (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={`/platform/tenants/${row.original.id}`} />}
            >
              Detail
            </Button>
          ),
        }),
      ]),
    []
  )

  return (
    <DataTable
      columns={columns}
      data={rows}
      total={total}
      pageCount={lastPage}
      pageIndex={state.page - 1}
      pageSize={state.perPage}
      onPageChange={tq.setPageIndex}
      onPageSizeChange={tq.setPerPage}
      sorting={tq.sorting}
      onSortingChange={tq.setSorting}
      searchValue={tq.searchInput}
      onSearchChange={tq.setSearchInput}
      searching={tq.pending}
      searchPlaceholder="Cari nama atau slug organisasi…"
      emptyMessage="Belum ada tenant."
    />
  )
}
