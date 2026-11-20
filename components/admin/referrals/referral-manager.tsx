"use client"

import { useEffect, useState } from "react"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { AdminPaginationLinks } from "@/components/admin/admin-pagination"
import { ReferralDetailSheet } from "@/components/admin/referrals/referral-detail-sheet"

import { referralStatusLabel } from "@/lib/admin/referrals"
import { formatDateTime, priorityLabel } from "@/lib/reception/format"

import type { Referral } from "@/types/admin"
import type { Department, Paginated } from "@/types/reception"

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
  pagination,
  departments,
  filters,
}: {
  referrals: Referral[]
  pagination: Paginated<Referral>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referral</TableHead>

                <TableHead>Sumber</TableHead>

                <TableHead>Tujuan</TableHead>

                <TableHead>Status</TableHead>

                <TableHead>Prioritas</TableHead>

                <TableHead>Kunjungan Tujuan</TableHead>

                <TableHead>Dibuat</TableHead>

                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {referrals.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="p-8 text-center text-sm text-muted-foreground"
                  >
                    Tidak ada referral untuk filter ini.
                  </TableCell>
                </TableRow>
              ) : (
                referrals.map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell className="font-mono text-xs">
                      #{referral.id}
                    </TableCell>

                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {referral.source_visit?.patient?.name ?? "-"}
                        </p>

                        <p className="font-mono text-xs text-muted-foreground">
                          {referral.source_visit?.visit_number ?? "-"}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      {referral.target_department?.name ?? "-"}
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline">
                        {referralStatusLabel(referral.status)}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {priorityLabel(referral.priority)}
                    </TableCell>

                    <TableCell className="font-mono text-xs">
                      {referral.target_visit?.visit_number ?? "-"}
                    </TableCell>

                    <TableCell className="text-xs">
                      {formatDateTime(referral.created_at)}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setSelectedReferralId(referral.id)
                        }
                      >
                        <ArrowRightLeft />
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
        hrefFor={(page) => buildQuery({ ...filters, page })}
      />

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
