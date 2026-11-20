"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
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

import { referralStatusLabel } from "@/lib/admin/referrals"
import { formatDateTime, priorityLabel } from "@/lib/reception/format"

import type { Referral } from "@/types/admin"
import type { Department } from "@/types/reception"

const columnHelper = createDataTableColumnHelper<Referral>()

const STATUS_OPTIONS = ["PENDING", "ACCEPTED", "COMPLETED", "CANCELLED"]

type ReferralFilters = {
  target_department_id?: number
  status?: string
  page?: number
}

function buildQuery(
  filters: ReferralFilters,
  overrides: Partial<ReferralFilters> = {}
): string {
  const merged = { ...filters, ...overrides }
  const params = new URLSearchParams()

  if (merged.target_department_id) {
    params.set("target_department_id", String(merged.target_department_id))
  }

  if (merged.status) params.set("status", merged.status)
  if (merged.page && merged.page > 1) params.set("page", String(merged.page))

  const query = params.toString()

  return query ? `/admin/referrals?${query}` : "/admin/referrals"
}

export function ReferralManager({
  referrals,
  departments,
  filters,
}: {
  referrals: Referral[]
  departments: Department[]
  filters: ReferralFilters
}) {
  const router = useRouter()
  const [departmentId, setDepartmentId] = useState(
    filters.target_department_id
      ? String(filters.target_department_id)
      : "all"
  )
  const [status, setStatus] = useState(filters.status ?? "all")
  const [selectedReferralId, setSelectedReferralId] = useState<number | null>(
    null
  )

  useEffect(() => {
    setDepartmentId(
      filters.target_department_id
        ? String(filters.target_department_id)
        : "all"
    )
    setStatus(filters.status ?? "all")
  }, [filters.target_department_id, filters.status])

  function applyFilters() {
    router.push(
      buildQuery(filters, {
        target_department_id:
          departmentId === "all" ? undefined : Number(departmentId),
        status: status === "all" ? undefined : status,
        page: 1,
      })
    )
  }

  function resetFilters() {
    router.push("/admin/referrals")
  }

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
        }),
        columnHelper.display({
          id: "target",
          header: "Tujuan",
          cell: ({ row }) => row.original.target_department?.name ?? "-",
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

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Department Tujuan</Label>

              <Select
                value={departmentId}
                onValueChange={(value) =>
                  setDepartmentId(value ?? "all")
                }
              >
                <SelectTrigger className="w-full">
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
            </div>

            <div className="space-y-2">
              <Label>Status</Label>

              <Select
                value={status}
                onValueChange={(value) => setStatus(value ?? "all")}
              >
                <SelectTrigger className="w-full">
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
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={applyFilters}>Terapkan</Button>

              <Button variant="outline" onClick={resetFilters}>
                Reset
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={referrals}
            getRowId={(row) => String(row.id)}
            emptyMessage="Tidak ada referral untuk filter ini."
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
