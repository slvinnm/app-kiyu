import { Users } from "lucide-react"
import { redirect } from "next/navigation"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { PatientManager } from "@/components/admin/patients/patient-manager"

import { getPatientsServer } from "@/lib/api/admin-server"
import { getApiErrorMessage } from "@/lib/api/error"
import { getSession } from "@/lib/auth/session"

import type { Paginated, Patient } from "@/types/reception"

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
  const search = first(params.search) ?? ""
  const rawPage = first(params.page)
  const parsedPage = rawPage ? Number(rawPage) : 1
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1

  let patients: Paginated<Patient> | null = null
  let error: string | null = null

  try {
    patients = await getPatientsServer({
      search: search || undefined,
      page,
      per_page: 200,
    })
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat data pasien.")
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
      <AdminPageHeader
        title="Pasien"
        description="Direktori pasien dan koreksi data identitas."
        icon={<Users className="size-5" />}
      />

      {error || !patients ? (
        <Alert variant="destructive">
          <AlertTitle>Data pasien tidak tersedia</AlertTitle>

          <AlertDescription>
            {error ?? "Terjadi kesalahan saat memuat pasien."}
          </AlertDescription>
        </Alert>
      ) : (
        <PatientManager patients={patients.data} search={search} />
      )}
    </div>
  )
}
