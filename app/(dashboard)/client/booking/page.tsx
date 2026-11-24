import { CalendarPlusIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"

import { OnlineBookingForm } from "@/components/client/online-booking-form"
import {
  PatientLoadError,
  ProfileRequired,
} from "@/components/client/client-notices"

import { getApiErrorMessage } from "@/lib/api/error"
import { getCurrentPatientServer } from "@/lib/api/clients-server"
import { getActiveDepartmentsServer } from "@/lib/api/reception-server"

import type { Department } from "@/types/reception"

export default async function Page() {
  let current

  try {
    current = await getCurrentPatientServer()
  } catch (cause) {
    return (
      <div className="mx-auto w-full max-w-6xl p-4 md:p-6 lg:p-8">
        <PageHeader />

        <PatientLoadError
          message={getApiErrorMessage(cause, "Gagal memuat profil pasien.")}
        />
      </div>
    )
  }

  if (!current.profile) {
    return (
      <div className="mx-auto w-full max-w-6xl p-4 md:p-6 lg:p-8">
        <PageHeader />
        <ProfileRequired />
      </div>
    )
  }

  let departments: Department[] = []

  try {
    departments = await getActiveDepartmentsServer()
  } catch (cause) {
    return (
      <div className="mx-auto w-full max-w-6xl p-4 md:p-6 lg:p-8">
        <PageHeader />

        <PatientLoadError
          message={getApiErrorMessage(cause, "Gagal memuat daftar poli.")}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-6 lg:p-8">
      <PageHeader />

      <div className="mt-6">
        <OnlineBookingForm
          clientId={current.profile.id}
          departments={departments}
        />
      </div>
    </div>
  )
}

function PageHeader() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Badge variant="outline">Pasien</Badge>

        <span className="text-xs text-muted-foreground">Online Booking</span>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CalendarPlusIcon className="size-5" />
        </div>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Booking Online
          </h1>

          <p className="text-sm text-muted-foreground">
            Buat rencana kunjungan sebelum datang ke klinik.
          </p>
        </div>
      </div>
    </div>
  )
}
