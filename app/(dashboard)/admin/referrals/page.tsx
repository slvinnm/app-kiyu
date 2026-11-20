import { ArrowRightLeft } from "lucide-react"
import { redirect } from "next/navigation"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { ReferralManager } from "@/components/admin/referrals/referral-manager"

import {
  getDepartmentsServer,
  getReferralsServer,
} from "@/lib/api/admin-server"
import { getApiErrorMessage } from "@/lib/api/error"
import { getSession } from "@/lib/auth/session"

import type { Referral } from "@/types/admin"
import type { Department, Paginated } from "@/types/reception"

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
  const rawDepartment = first(params.target_department_id)
  const rawPage = first(params.page)
  const parsedDepartment = rawDepartment ? Number(rawDepartment) : Number.NaN
  const parsedPage = rawPage ? Number(rawPage) : 1

  const filters = {
    target_department_id: Number.isInteger(parsedDepartment)
      ? parsedDepartment
      : undefined,
    status: first(params.status) || undefined,
    page: Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1,
  }

  let referrals: Paginated<Referral> | null = null
  let departments: Department[] = []
  let error: string | null = null

  try {
    ;[referrals, departments] = await Promise.all([
      getReferralsServer({ ...filters, per_page: 20 }),
      getDepartmentsServer(),
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
          referrals={referrals.data}
          pagination={referrals}
          departments={departments}
          filters={filters}
        />
      )}
    </div>
  )
}
