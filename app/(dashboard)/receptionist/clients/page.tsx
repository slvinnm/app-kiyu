import { UsersIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

import { CustomerDirectory } from "@/components/receptionist/clients/client-directory"

import { getApiErrorMessage } from "@/lib/api/error"
import { getCustomersTableServer } from "@/lib/api/reception-server"
import { parseTableParams } from "@/lib/table-params"

import type { Paginated, Customer } from "@/types/reception"

const SORTABLE = ["name", "phone", "created_at", "id"]

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const { table } = parseTableParams(params, {
    sortable: SORTABLE,
    defaultPerPage: 10,
  })

  let customers: Paginated<Customer> | null = null
  let error: string | null = null

  try {
    customers = await getCustomersTableServer(table)
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat data pelanggan.")
  }

  return (
    <div className="mx-auto w-full p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Reception</Badge>

          <span className="text-xs text-muted-foreground">
            Customer Directory
          </span>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UsersIcon className="size-5" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Pelanggan</h1>

            <p className="text-sm text-muted-foreground">
              Cari data pelanggan dan lihat riwayat kunjungannya.
            </p>
          </div>
        </div>
      </div>

      {error || !customers ? (
        <Alert variant="destructive">
          <AlertTitle>Data pelanggan tidak tersedia</AlertTitle>

          <AlertDescription>
            {error ?? "Terjadi kesalahan saat memuat pelanggan."}
          </AlertDescription>
        </Alert>
      ) : (
        <CustomerDirectory
          rows={customers.data}
          total={customers.total}
          lastPage={customers.last_page}
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
