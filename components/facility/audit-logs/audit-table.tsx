"use client"

import { useEffect, useMemo, useState } from "react"

import {
  DataTable,
  createDataTableColumnHelper,
} from "@/components/ui/data-table"
import { Input } from "@/components/ui/input"

import { useTableQuery } from "@/hooks/use-table-query"
import { formatDateTime } from "@/lib/reception/format"

import type { AuditLog } from "@/types/admin"
import type { TableQueryState } from "@/hooks/use-table-query"

const columnHelper = createDataTableColumnHelper<AuditLog>()

function metadataText(metadata: unknown): string {
  if (metadata === null || metadata === undefined) {
    return "-"
  }

  try {
    const text = JSON.stringify(metadata)
    return text.length > 120 ? `${text.slice(0, 120)}…` : text
  } catch {
    return "-"
  }
}

export function AuditTable({
  rows,
  total,
  lastPage,
  state,
}: {
  rows: AuditLog[]
  total: number
  lastPage: number
  filters: Record<string, string>
  state: TableQueryState
}) {
  const tq = useTableQuery(state)

  const [action, setAction] = useState(state.filters?.action ?? "")
  const [entityType, setEntityType] = useState(state.filters?.entity_type ?? "")
  const [userId, setUserId] = useState(state.filters?.user_id ?? "")

  useEffect(() => {
    setAction(state.filters?.action ?? "")
    setEntityType(state.filters?.entity_type ?? "")
    setUserId(state.filters?.user_id ?? "")
  }, [
    state.filters?.action,
    state.filters?.entity_type,
    state.filters?.user_id,
  ])

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("created_at", {
          header: "Waktu",
          cell: ({ row }) => (
            <span className="text-xs whitespace-nowrap">
              {formatDateTime(row.original.created_at)}
            </span>
          ),
        }),
        columnHelper.accessor("user_id", {
          header: "User",
          cell: ({ row }) => (
            <span className="text-xs">{row.original.user_id ?? "sistem"}</span>
          ),
        }),
        columnHelper.accessor("action", {
          header: "Action",
          cell: ({ row }) => (
            <span className="font-medium">{row.original.action}</span>
          ),
        }),
        columnHelper.display({
          id: "entity",
          header: "Entity",
          cell: ({ row }) => (
            <span className="text-xs">
              {row.original.entity_type} #{row.original.entity_id ?? "-"}
            </span>
          ),
          enableSorting: false,
        }),
        columnHelper.display({
          id: "metadata",
          header: "Metadata",
          cell: ({ row }) => (
            <span className="block max-w-xs truncate font-mono text-[10px] text-muted-foreground">
              {metadataText(row.original.metadata)}
            </span>
          ),
          enableSorting: false,
        }),
        columnHelper.accessor("ip_address", {
          header: "IP",
          cell: ({ row }) => (
            <span className="text-xs">{row.original.ip_address ?? "-"}</span>
          ),
          enableSorting: false,
        }),
      ]),
    []
  )

  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(row) => String(row.id)}
      emptyMessage="Tidak ada audit log untuk filter ini."
      pageCount={lastPage}
      pageIndex={state.page - 1}
      pageSize={state.perPage}
      total={total}
      sorting={tq.sorting}
      onSortingChange={tq.setSorting}
      onPageChange={tq.setPageIndex}
      onPageSizeChange={tq.setPerPage}
      toolbar={
        <>
          <Input
            value={action}
            onChange={(event) => {
              setAction(event.target.value)
              tq.setFilterDebounced("action", event.target.value)
            }}
            placeholder="Action: VISIT_CANCELLED"
            aria-label="Filter action"
            className="w-full sm:w-[200px]"
          />

          <Input
            value={entityType}
            onChange={(event) => {
              setEntityType(event.target.value)
              tq.setFilterDebounced("entity_type", event.target.value)
            }}
            placeholder="Entity: Visit"
            aria-label="Filter entity"
            className="w-full sm:w-[180px]"
          />

          <Input
            value={userId}
            onChange={(event) => {
              setUserId(event.target.value)
              tq.setFilterDebounced("user_id", event.target.value)
            }}
            placeholder="User: admin@kiyu.id"
            aria-label="Filter user"
            className="w-full sm:w-[200px]"
          />
        </>
      }
    />
  )
}
