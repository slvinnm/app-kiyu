import { Users } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { PatientManager } from "@/components/admin/clients/client-manager"

import { getPatientsServer } from "@/lib/api/admin-server"
import { getApiErrorMessage } from "@/lib/api/error"
import { parseTableParams } from "@/lib/table-params"

import type { Paginated, Patient } from "@/types/reception"

const SORTABLE = ["name", "mrn", "nik", "created_at", "id"]

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

  let patients: Paginated<Patient> | null = null
  let error: string | null = null

  try {
    patients = await getPatientsServer({ ...table, ...filters })
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
        <PatientManager
          rows={patients.data}
          total={patients.total}
          lastPage={patients.last_page}
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
