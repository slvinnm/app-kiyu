"use client"

import { useMemo, useState } from "react"
import { ArrowRightLeft } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
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

import { ReferralDetailSheet } from "@/components/admin/referrals/referral-detail-sheet"

import { useTableQuery } from "@/hooks/use-table-query"
import { referralStatusLabel } from "@/lib/admin/referrals"
import { formatDateTime, priorityLabel } from "@/lib/reception/format"

import type { Referral } from "@/types/admin"
import type { Department } from "@/types/reception"
import type { TableQueryState } from "@/hooks/use-table-query"

const columnHelper = createDataTableColumnHelper<Referral>()

const STATUS_OPTIONS = ["PENDING", "ACCEPTED", "COMPLETED", "CANCELLED"]

export function ReferralManager({
  rows,
  total,
  lastPage,
  state,
  departments,
}: {
  rows: Referral[]
  total: number
  lastPage: number
  filters: Record<string, string>
  state: TableQueryState
  departments: Department[]
}) {
  const tq = useTableQuery(state)
  const [selectedReferralId, setSelectedReferralId] = useState<number | null>(
    null
  )

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("id", {
          header: "Referral",
          cell: ({ row }) => (
            <span className="font-mono text-xs">#{row.original.id}</span>
          ),
        }),
        columnHelper.display({
          id: "source",
          header: "Sumber",
          cell: ({ row }) => (
            <div>
              <p className="font-medium">
                {row.original.source_visit?.patient?.name ?? "-"}
              </p>

              <p className="font-mono text-xs text-muted-foreground">
                {row.original.source_visit?.visit_number ?? "-"}
              </p>
            </div>
          ),
          enableSorting: false,
        }),
        columnHelper.display({
          id: "target",
          header: "Tujuan",
          cell: ({ row }) => row.original.target_department?.name ?? "-",
          enableSorting: false,
        }),
        columnHelper.accessor("status", {
          header: "Status",
          cell: ({ row }) => (
            <Badge variant="outline">
              {referralStatusLabel(row.original.status)}
            </Badge>
          ),
        }),
        columnHelper.accessor("priority", {
          header: "Prioritas",
          cell: ({ row }) => priorityLabel(row.original.priority),
        }),
        columnHelper.display({
          id: "target_visit",
          header: "Kunjungan Tujuan",
          cell: ({ row }) => (
            <span className="font-mono text-xs">
              {row.original.target_visit?.visit_number ?? "-"}
            </span>
          ),
          enableSorting: false,
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
                onClick={() => setSelectedReferralId(row.original.id)}
              >
                <ArrowRightLeft />
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
            <CardTitle className="text-base">Daftar Referral</CardTitle>

            <CardDescription>
              Referral dibuat dari detail kunjungan. Kunjungan tujuan dan
              tiketnya dibuat otomatis.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={rows}
            getRowId={(row) => String(row.id)}
            emptyMessage="Tidak ada referral untuk filter ini."
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
            searchPlaceholder="Cari nama pasien atau nomor kunjungan..."
            toolbar={
              <>
                <Select
                  value={state.filters?.target_department_id ?? "all"}
                  onValueChange={(value) =>
                    tq.setFilter(
                      "target_department_id",
                      value === "all" ? null : value
                    )
                  }
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">Semua Department</SelectItem>

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
                        {referralStatusLabel(value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            }
          />
        </CardContent>
      </Card>

      <ReferralDetailSheet
        referralId={selectedReferralId}
        open={selectedReferralId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedReferralId(null)
          }
        }}
      />
    </>
  )
}
