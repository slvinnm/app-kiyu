"use client"

import { useEffect, useMemo, useState } from "react"
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

import { VisitDetailSheet } from "@/components/admin/visits/visit-detail-sheet"

import {
  channelLabel,
  formatDateTime,
  priorityLabel,
  visitStatusLabel,
} from "@/lib/reception/format"

import type { Department, Visit, VisitStatus } from "@/types/reception"

const columnHelper = createDataTableColumnHelper<Visit>()

const STATUS_OPTIONS: VisitStatus[] = [
  "AWAITING_CHECKIN",
  "WAITING",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]

type VisitFilters = {
  department_id?: number
  status?: string
  date?: string
  page?: number
}

function buildQuery(
  filters: VisitFilters,
  overrides: Partial<VisitFilters> = {}
): string {
  const merged = { ...filters, ...overrides }
  const params = new URLSearchParams()

  if (merged.department_id) {
    params.set("department_id", String(merged.department_id))
  }

  if (merged.status) {
    params.set("status", merged.status)
  }

  if (merged.date) {
    params.set("date", merged.date)
  }

  if (merged.page && merged.page > 1) {
    params.set("page", String(merged.page))
  }

  const query = params.toString()

  return query ? `/admin/visits?${query}` : "/admin/visits"
}

export function VisitManager({
  visits,
  departments,
  filters,
  actorEmail,
}: {
  visits: Visit[]
  departments: Department[]
  filters: VisitFilters
  actorEmail: string
}) {
  const router = useRouter()
  const [departmentId, setDepartmentId] = useState(
    filters.department_id ? String(filters.department_id) : "all"
  )
  const [status, setStatus] = useState(filters.status ?? "all")
  const [date, setDate] = useState(filters.date ?? "")
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null)

  useEffect(() => {
    setDepartmentId(
      filters.department_id ? String(filters.department_id) : "all"
    )
    setStatus(filters.status ?? "all")
    setDate(filters.date ?? "")
  }, [filters.department_id, filters.status, filters.date])

  function applyFilters() {
    router.push(
      buildQuery(filters, {
        department_id:
          departmentId === "all" ? undefined : Number(departmentId),
        status: status === "all" ? undefined : status,
        date: date || undefined,
        page: 1,
      })
    )
  }

  function resetFilters() {
    router.push("/admin/visits")
  }

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
          id: "patient",
          header: "Pasien",
          cell: ({ row }) => (
            <div>
              <p className="font-medium">{row.original.patient?.name ?? "-"}</p>

              <p className="text-xs text-muted-foreground">
                {row.original.patient?.mrn ?? "-"}
              </p>
            </div>
          ),
        }),
        columnHelper.display({
          id: "department",
          header: "Poli",
          cell: ({ row }) => row.original.department?.name ?? "-",
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

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Poli</Label>

              <Select
                value={departmentId}
                onValueChange={(v) => setDepartmentId(v ?? "all")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">Semua Poli</SelectItem>

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
                onValueChange={(v) => setStatus(v ?? "all")}
              >
                <SelectTrigger className="w-full">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="visit-date">Tanggal</Label>

              <Input
                id="visit-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
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
            data={visits}
            getRowId={(row) => String(row.id)}
            emptyMessage="Tidak ada kunjungan untuk filter ini."
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
