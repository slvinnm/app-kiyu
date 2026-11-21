import { redirect } from "next/navigation"
import { UsersIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

import { PatientDirectory } from "@/components/receptionist/patients/patient-directory"

import { getApiErrorMessage } from "@/lib/api/error"
import { getPatientsTableServer } from "@/lib/api/reception-server"
import { getSession } from "@/lib/auth/session"
import { parseTableParams } from "@/lib/table-params"

import type { Paginated, Patient } from "@/types/reception"

const SORTABLE = ["name", "mrn", "nik", "created_at", "id"]

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
  const { table } = parseTableParams(params, {
    sortable: SORTABLE,
    defaultPerPage: 10,
  })

  let patients: Paginated<Patient> | null = null
  let error: string | null = null

  try {
    patients = await getPatientsTableServer(table)
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat data pasien.")
  }

  return (
    <div className="mx-auto w-full p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Reception</Badge>

          <span className="text-xs text-muted-foreground">
            Patient Directory
          </span>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UsersIcon className="size-5" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Pasien</h1>

            <p className="text-sm text-muted-foreground">
              Cari data pasien dan lihat riwayat kunjungannya.
            </p>
          </div>
        </div>
      </div>

      {error || !patients ? (
        <Alert variant="destructive">
          <AlertTitle>Data pasien tidak tersedia</AlertTitle>

          <AlertDescription>
            {error ?? "Terjadi kesalahan saat memuat pasien."}
          </AlertDescription>
        </Alert>
      ) : (
        <PatientDirectory
          rows={patients.data}
          total={patients.total}
          lastPage={patients.last_page}
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
