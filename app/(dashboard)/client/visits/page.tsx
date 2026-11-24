import { FileTextIcon } from "lucide-react"
import { redirect } from "next/navigation"

import { Badge } from "@/components/ui/badge"

import { PatientVisitsList } from "@/components/client/client-visits-list"
import {
  PatientLoadError,
  ProfileRequired,
} from "@/components/client/client-notices"

import { getApiErrorMessage } from "@/lib/api/error"
import {
  getCurrentClientServer,
  getClientVisitsServer,
} from "@/lib/api/clients-server"
import { getSession } from "@/lib/auth/session"

import type { PatientVisit } from "@/types/client"

export default async function Page() {

  let current

  try {
    current = await getCurrentClientServer()
  } catch (cause) {
    return (
      <div className="mx-auto w-full max-w-5xl p-4 md:p-6 lg:p-8">
        <PageHeader />

        <PatientLoadError
          message={getApiErrorMessage(cause, "Gagal memuat profil pasien.")}
        />
      </div>
    )
  }

  if (!current.profile) {
    return (
      <div className="mx-auto w-full max-w-5xl p-4 md:p-6 lg:p-8">
        <PageHeader />
        <ProfileRequired />
      </div>
    )
  }

  let visits: PatientVisit[] = []

  try {
    const page = await getClientVisitsServer(current.profile.id, 50)
    visits = page.data
  } catch (cause) {
    return (
      <div className="mx-auto w-full max-w-5xl p-4 md:p-6 lg:p-8">
        <PageHeader />

        <PatientLoadError
          message={getApiErrorMessage(cause, "Gagal memuat kunjungan.")}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl p-4 md:p-6 lg:p-8">
      <PageHeader />

      <div className="mt-6">
        <PatientVisitsList visits={visits} />
      </div>
    </div>
  )
}

function PageHeader() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Badge variant="outline">Pasien</Badge>

        <span className="text-xs text-muted-foreground">Riwayat Layanan</span>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileTextIcon className="size-5" />
        </div>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Kunjungan</h1>

          <p className="text-sm text-muted-foreground">
            Daftar kunjungan dan status antrian Anda.
          </p>
        </div>
      </div>
    </div>
  )
}
