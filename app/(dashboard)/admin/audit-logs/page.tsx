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

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AuditTable } from "@/components/admin/audit-logs/audit-table"

import { getAuditLogsServer } from "@/lib/api/admin-server"
import { getApiErrorMessage } from "@/lib/api/error"
import { getSession } from "@/lib/auth/session"

import type { AuditLog } from "@/types/admin"
import type { Paginated } from "@/types/reception"

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
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
    logs = await getAuditLogsServer({ ...filters, per_page: 200 })
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat audit log.")
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
            <AuditTable logs={logs.data} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
