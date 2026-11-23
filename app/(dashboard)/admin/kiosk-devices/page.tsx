import { MonitorSmartphone } from "lucide-react"
import { redirect } from "next/navigation"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { KioskDeviceManager } from "@/components/admin/kiosk-devices/kiosk-device-manager"

import { getKioskDevicesServer } from "@/lib/api/admin-server"
import { getApiErrorMessage } from "@/lib/api/error"
import { getSession } from "@/lib/auth/session"

import type { KioskDevice } from "@/types/reception"

export default async function Page() {
  const session = await getSession()

  if (!session?.user?.role) {
    redirect("/login")
  }

  let devices: KioskDevice[] | null = null
  let error: string | null = null

  try {
    devices = await getKioskDevicesServer()
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat perangkat kiosk.")
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
      <AdminPageHeader
        title="Perangkat Kiosk"
        description="Daftarkan dan nonaktifkan mesin anjungan antrian."
        icon={<MonitorSmartphone className="size-5" />}
      />

      {error || !devices ? (
        <Alert variant="destructive">
          <AlertTitle>Daftar perangkat tidak tersedia</AlertTitle>

          <AlertDescription>
            {error ?? "Terjadi kesalahan saat memuat perangkat kiosk."}
          </AlertDescription>
        </Alert>
      ) : (
        <KioskDeviceManager rows={devices} />
      )}
    </div>
  )
}
