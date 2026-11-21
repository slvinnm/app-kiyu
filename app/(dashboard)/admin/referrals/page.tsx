import { ArrowRightLeft } from "lucide-react"
import { redirect } from "next/navigation"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { ReferralManager } from "@/components/admin/referrals/referral-manager"

import {
  getDepartmentOptionsServer,
  getReferralsServer,
} from "@/lib/api/admin-server"
import { getApiErrorMessage } from "@/lib/api/error"
import { getSession } from "@/lib/auth/session"
import { numberFilter, parseTableParams } from "@/lib/table-params"

import type { Referral } from "@/types/admin"
import type { Department, Paginated } from "@/types/reception"

const SORTABLE = ["status", "priority", "created_at", "id"]

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
  const { table, filters } = parseTableParams(params, {
    sortable: SORTABLE,
    defaultPerPage: 10,
    filters: ["target_department_id", "status"],
  })

  let referrals: Paginated<Referral> | null = null
  let departments: Department[] = []
  let error: string | null = null

  try {
    ;[referrals, departments] = await Promise.all([
      getReferralsServer({
        ...table,
        target_department_id: numberFilter(filters.target_department_id),
        status: filters.status,
      }),
      getDepartmentOptionsServer(),
    ])
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat referral.")
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
      <AdminPageHeader
        title="Referral"
        description="Pantau rujukan antar-poli dan tiket tujuan yang dihasilkan."
        icon={<ArrowRightLeft className="size-5" />}
      />

      {error || !referrals ? (
        <Alert variant="destructive">
          <AlertTitle>Data referral tidak tersedia</AlertTitle>

          <AlertDescription>
            {error ?? "Terjadi kesalahan saat memuat referral."}
          </AlertDescription>
        </Alert>
      ) : (
        <ReferralManager
          rows={referrals.data}
          total={referrals.total}
          lastPage={referrals.last_page}
          filters={filters}
          state={{
            search: table.search ?? "",
            page: table.page,
            perPage: table.per_page,
            sort: table.sort ?? "",
            direction: table.direction,
            filters,
            filterKeys: ["target_department_id", "status"],
          }}
          departments={departments}
        />
      )}
    </div>
  )
}
