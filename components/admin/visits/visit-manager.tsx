"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DataTable,
  createDataTableColumnHelper,
} from "@/components/ui/data-table"

import { VisitDetailSheet } from "@/components/admin/visits/visit-detail-sheet"

import { useTableQuery } from "@/hooks/use-table-query"
import {
  channelLabel,
  formatDateTime,
  priorityLabel,
  visitStatusLabel,
} from "@/lib/reception/format"

import type { Department, Visit, VisitStatus } from "@/types/reception"
import type { TableQueryState } from "@/hooks/use-table-query"

const columnHelper = createDataTableColumnHelper<Visit>()

const STATUS_OPTIONS: VisitStatus[] = [
  "AWAITING_CHECKIN",
  "WAITING",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]

export function VisitManager({
  rows,
  total,
  lastPage,
  state,
  departments,
  actorEmail,
}: {
  rows: Visit[]
  total: number
  lastPage: number
  filters: Record<string, string>
  state: TableQueryState
  departments: Department[]
  actorEmail: string
}) {
  const router = useRouter()
  const tq = useTableQuery(state)
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null)

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("visit_number", {
          header: "Kunjungan",
          cell: ({ row }) => (
            <span className="font-mono text-xs">
              {row.original.visit_number}
            </span>
          ),
        }),
        columnHelper.display({
          id: "customer",
          header: "Pelanggan",
          cell: ({ row }) => (
            <div>
              <p className="font-medium">{row.original.client?.name ?? "-"}</p>

              <p className="text-xs text-muted-foreground">
                {row.original.client?.phone ?? "-"}
              </p>
            </div>
          ),
          enableSorting: false,
        }),
        columnHelper.display({
          id: "department",
          header: "Departemen",
          cell: ({ row }) => row.original.department?.name ?? "-",
          enableSorting: false,
        }),
        columnHelper.accessor("intake_channel", {
          header: "Channel",
          cell: ({ row }) => channelLabel(row.original.intake_channel),
        }),
        columnHelper.accessor("priority", {
          header: "Prioritas",
          cell: ({ row }) => priorityLabel(row.original.priority),
        }),
        columnHelper.accessor("status", {
          header: "Status",
          cell: ({ row }) => (
            <Badge variant="outline">
              {visitStatusLabel(row.original.status)}
            </Badge>
          ),
        }),
        columnHelper.accessor("created_at", {
          header: "Dibuat",
          cell: ({ row }) => (
            <span className="text-xs">
              {formatDateTime(row.original.created_at)}
            </span>
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
                onClick={() => setSelectedVisitId(row.original.id)}
              >
                Detail
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
          <div>
            <CardTitle className="text-base">Kunjungan</CardTitle>

            <CardDescription>
              Pantau kunjungan, ubah prioritas, dan batalkan kunjungan.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={rows}
            getRowId={(row) => String(row.id)}
            emptyMessage="Tidak ada kunjungan untuk filter ini."
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
            searchPlaceholder="Cari nomor antrean atau nama pelanggan..."
            toolbar={
              <>
                <Select
                  value={state.filters?.department_id ?? "all"}
                  onValueChange={(value) =>
                    tq.setFilter(
                      "department_id",
                      value === "all" ? null : value
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
                  value={state.filters?.status ?? "all"}
                  onValueChange={(value) =>
                    tq.setFilter("status", value === "all" ? null : value)
                  }
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>

                    {STATUS_OPTIONS.map((value) => (
                      <SelectItem key={value} value={value}>
                        {visitStatusLabel(value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  className="w-full sm:w-[200px]"
                  id="visit-date"
                  type="date"
                  value={state.filters?.date ?? ""}
                  onChange={(event) =>
                    tq.setFilter("date", event.target.value || null)
                  }
                />
              </>
            }
          />
        </CardContent>
      </Card>

      <VisitDetailSheet
        visitId={selectedVisitId}
        actorEmail={actorEmail}
        departments={departments}
        open={selectedVisitId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedVisitId(null)
          }
        }}
        onChanged={() => router.refresh()}
      />
    </>
  )
}
