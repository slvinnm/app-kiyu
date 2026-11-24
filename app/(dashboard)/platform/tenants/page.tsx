import { Building2 } from "lucide-react"

import { ConsolePageHeader } from "@/components/console/console-page-header"
import { TenantTable } from "@/components/platform/tenants/tenant-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { getApiErrorMessage } from "@/lib/api/error"
import { getTenantsServer } from "@/lib/api/platform-server"
import { parseTableParams } from "@/lib/table-params"

import type { Paginated, TenantRow } from "@/types/platform"

const SORTABLE = ["name", "slug", "status", "created_at", "id"]

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const { table } = parseTableParams(params, {
    sortable: SORTABLE,
    defaultPerPage: 25,
  })

  let tenants: Paginated<TenantRow> | null = null
  let error: string | null = null

  try {
    tenants = await getTenantsServer(table)
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat daftar tenant.")
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <ConsolePageHeader
        context="Platform"
        title="Manajemen Tenant"
        description="Seluruh organisasi yang terdaftar di platform KIYU."
        icon={<Building2 className="size-5" />}
      />

      {error || !tenants ? (
        <Alert variant="destructive">
          <AlertTitle>Data tenant tidak tersedia</AlertTitle>
          <AlertDescription>
            {error ?? "Terjadi kesalahan saat memuat tenant."}
          </AlertDescription>
        </Alert>
      ) : (
        <TenantTable
          rows={tenants.data}
          total={tenants.total}
          lastPage={tenants.last_page}
          state={{
            search: table.search ?? "",
            page: table.page,
            perPage: table.per_page,
            sort: table.sort ?? "",
            direction: table.direction,
          }}
        />
      )}
    </div>
  )
}
