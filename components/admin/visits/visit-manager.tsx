"use client"

import { useEffect, useState } from "react"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { AdminPaginationLinks } from "@/components/admin/admin-pagination"
import { VisitDetailSheet } from "@/components/admin/visits/visit-detail-sheet"

import {
  channelLabel,
  formatDateTime,
  priorityLabel,
  visitStatusLabel,
} from "@/lib/reception/format"

import type {
  Department,
  Paginated,
  Visit,
  VisitStatus,
} from "@/types/reception"

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
  pagination,
  departments,
  filters,
  actorEmail,
}: {
  visits: Visit[]
  pagination: Paginated<Visit>
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

              <Select value={departmentId} onValueChange={(v) => setDepartmentId(v ?? "all")}>
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

              <Select value={status} onValueChange={(v) => setStatus(v ?? "all")}>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kunjungan</TableHead>

                <TableHead>Pasien</TableHead>

                <TableHead>Poli</TableHead>

                <TableHead>Channel</TableHead>

                <TableHead>Prioritas</TableHead>

                <TableHead>Status</TableHead>

                <TableHead>Dibuat</TableHead>

                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {visits.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="p-8 text-center text-sm text-muted-foreground"
                  >
                    Tidak ada kunjungan untuk filter ini.
                  </TableCell>
                </TableRow>
              ) : (
                visits.map((visit) => (
                  <TableRow key={visit.id}>
                    <TableCell className="font-mono text-xs">
                      {visit.visit_number}
                    </TableCell>

                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {visit.patient?.name ?? "-"}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {visit.patient?.mrn ?? "-"}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      {visit.department?.name ?? "-"}
                    </TableCell>

                    <TableCell>
                      {channelLabel(visit.intake_channel)}
                    </TableCell>

                    <TableCell>
                      {priorityLabel(visit.priority)}
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline">
                        {visitStatusLabel(visit.status)}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs">
                      {formatDateTime(visit.created_at)}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedVisitId(visit.id)}
                      >
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AdminPaginationLinks
        currentPage={pagination.current_page}
        lastPage={pagination.last_page}
        total={pagination.total}
        hrefFor={(page) =>
          buildQuery({ ...filters, page })
        }
      />

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
