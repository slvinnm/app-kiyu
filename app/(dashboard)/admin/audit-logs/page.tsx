import Link from "next/link"
import { ScrollText } from "lucide-react"
import { redirect } from "next/navigation"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminPaginationLinks } from "@/components/admin/admin-pagination"

import { getAuditLogsServer } from "@/lib/api/admin-server"
import { getApiErrorMessage } from "@/lib/api/error"
import { getSession } from "@/lib/auth/session"
import { formatDateTime } from "@/lib/reception/format"

import type { AuditLog } from "@/types/admin"
import type { Paginated } from "@/types/reception"

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

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

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await getSession()

  if (!session?.user?.role) {
    redirect("/login")
  }

  const params = await searchParams
  const rawPage = first(params.page)
  const parsedPage = rawPage ? Number(rawPage) : 1

  const filters = {
    action: first(params.action) || undefined,
    entity_type: first(params.entity_type) || undefined,
    user_id: first(params.user_id) || undefined,
    page: Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1,
  }

  let logs: Paginated<AuditLog> | null = null
  let error: string | null = null

  try {
    logs = await getAuditLogsServer({ ...filters, per_page: 25 })
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat audit log.")
  }

  function hrefFor(page: number): string {
    const query = new URLSearchParams()

    if (filters.action) query.set("action", filters.action)
    if (filters.entity_type) query.set("entity_type", filters.entity_type)
    if (filters.user_id) query.set("user_id", filters.user_id)
    if (page > 1) query.set("page", String(page))

    const text = query.toString()

    return text ? `/admin/audit-logs?${text}` : "/admin/audit-logs"
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
      <AdminPageHeader
        title="Audit Log"
        description="Riwayat perubahan bisnis dan administratif yang sensitif."
        icon={<ScrollText className="size-5" />}
      />

      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-base">Aktivitas Sistem</CardTitle>

            <CardDescription>
              Filter berdasarkan action, tipe entitas, atau user.
            </CardDescription>
          </div>

          <form
            method="get"
            className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>

              <Input
                id="action"
                name="action"
                defaultValue={filters.action ?? ""}
                placeholder="VISIT_CANCELLED"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entity_type">Entity</Label>

              <Input
                id="entity_type"
                name="entity_type"
                defaultValue={filters.entity_type ?? ""}
                placeholder="Visit"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user_id">User</Label>

              <Input
                id="user_id"
                name="user_id"
                defaultValue={filters.user_id ?? ""}
                placeholder="admin@kiyu.id"
              />
            </div>

            <div className="flex items-end gap-2">
              <Button type="submit">Terapkan</Button>

              <Link
                href="/admin/audit-logs"
                className={buttonVariants({ variant: "outline" })}
              >
                Reset
              </Link>
            </div>
          </form>
        </CardHeader>

        <CardContent className="p-0">
          {error || !logs ? (
            <div className="p-6">
              <Alert variant="destructive">
                <AlertTitle>Audit log tidak tersedia</AlertTitle>

                <AlertDescription>
                  {error ?? "Terjadi kesalahan saat memuat audit log."}
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>

                  <TableHead>User</TableHead>

                  <TableHead>Action</TableHead>

                  <TableHead>Entity</TableHead>

                  <TableHead>Metadata</TableHead>

                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {logs.data.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="p-8 text-center text-sm text-muted-foreground"
                    >
                      Tidak ada audit log untuk filter ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.data.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {formatDateTime(log.created_at)}
                      </TableCell>

                      <TableCell className="text-xs">
                        {log.user_id ?? "sistem"}
                      </TableCell>

                      <TableCell className="font-medium">
                        {log.action}
                      </TableCell>

                      <TableCell className="text-xs">
                        {log.entity_type} #{log.entity_id ?? "-"}
                      </TableCell>

                      <TableCell className="max-w-xs truncate font-mono text-[10px] text-muted-foreground">
                        {metadataText(log.metadata)}
                      </TableCell>

                      <TableCell className="text-xs">
                        {log.ip_address ?? "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {logs && (
        <AdminPaginationLinks
          currentPage={logs.current_page}
          lastPage={logs.last_page}
          total={logs.total}
          hrefFor={hrefFor}
        />
      )}
    </div>
  )
}
