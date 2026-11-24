import { Building2 } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { ConsolePageHeader } from "@/components/console/console-page-header"
import { FacilityManager } from "@/components/facility/facilities/facility-manager"

import { getFacilitiesServer } from "@/lib/api/admin-server"
import { getApiErrorMessage } from "@/lib/api/error"

import type { Facility } from "@/types/reception"

export default async function Page() {
  let facilities: Facility[] | null = null
  let error: string | null = null

  try {
    facilities = await getFacilitiesServer()
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat fasilitas.")
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
      <ConsolePageHeader
        context="Organisasi"
        title="Fasilitas"
        description="Unit fisik tempat departemen dan antrian berjalan."
        icon={<Building2 className="size-5" />}
      />

      {error || !facilities ? (
        <Alert variant="destructive">
          <AlertTitle>Daftar fasilitas tidak tersedia</AlertTitle>

          <AlertDescription>
            {error ?? "Terjadi kesalahan saat memuat fasilitas."}
          </AlertDescription>
        </Alert>
      ) : (
        <FacilityManager rows={facilities} />
      )}
    </div>
  )
}
