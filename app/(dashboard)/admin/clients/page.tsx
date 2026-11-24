import { Users } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { CustomerManager } from "@/components/admin/clients/client-manager"

import { getCustomersServer } from "@/lib/api/admin-server"
import { getApiErrorMessage } from "@/lib/api/error"
import { parseTableParams } from "@/lib/table-params"

import type { Paginated, Customer } from "@/types/reception"

const SORTABLE = ["name", "phone", "created_at", "id"]

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const { table, filters } = parseTableParams(params, {
    sortable: SORTABLE,
    defaultPerPage: 10,
  })

  let customers: Paginated<Customer> | null = null
  let error: string | null = null

  try {
    customers = await getCustomersServer({ ...table, ...filters })
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat data pelanggan.")
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
      <AdminPageHeader
        title="Pelanggan"
        description="Direktori pelanggan dan koreksi data kontak."
        icon={<Users className="size-5" />}
      />

      {error || !customers ? (
        <Alert variant="destructive">
          <AlertTitle>Data pelanggan tidak tersedia</AlertTitle>

          <AlertDescription>
            {error ?? "Terjadi kesalahan saat memuat pelanggan."}
          </AlertDescription>
        </Alert>
      ) : (
        <CustomerManager
          rows={customers.data}
          total={customers.total}
          lastPage={customers.last_page}
          filters={filters}
          state={{
            search: table.search ?? "",
            page: table.page,
            perPage: table.per_page,
            sort: table.sort ?? "",
            direction: table.direction,
            filters,
          }}
        />
      )}
    </div>
  )
}
