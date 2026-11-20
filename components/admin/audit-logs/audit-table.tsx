"use client"

import { useMemo } from "react"

import {
  DataTable,
  createDataTableColumnHelper,
} from "@/components/ui/data-table"

import { formatDateTime } from "@/lib/reception/format"

import type { AuditLog } from "@/types/admin"

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

export function AuditTable({ logs }: { logs: AuditLog[] }) {
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
            <span className="text-xs">
              {row.original.user_id ?? "sistem"}
            </span>
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
        }),
        columnHelper.display({
          id: "metadata",
          header: "Metadata",
          cell: ({ row }) => (
            <span className="block max-w-xs truncate font-mono text-[10px] text-muted-foreground">
              {metadataText(row.original.metadata)}
            </span>
          ),
        }),
        columnHelper.accessor("ip_address", {
          header: "IP",
          cell: ({ row }) => (
            <span className="text-xs">{row.original.ip_address ?? "-"}</span>
          ),
        }),
      ]),
    []
  )

  return (
    <DataTable
      columns={columns}
      data={logs}
      getRowId={(row) => String(row.id)}
      emptyMessage="Tidak ada audit log untuk filter ini."
    />
  )
}
