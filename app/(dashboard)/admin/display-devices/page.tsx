import { MonitorPlay } from "lucide-react"
import { redirect } from "next/navigation"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { DisplayDeviceManager } from "@/components/admin/display-devices/display-device-manager"

import { getDisplayDevicesServer } from "@/lib/api/admin-server"
import { getApiErrorMessage } from "@/lib/api/error"
import { getSession } from "@/lib/auth/session"

import type { DisplayDevice } from "@/types/reception"

export default async function Page() {
  const session = await getSession()

  if (!session?.user?.role) {
    redirect("/login")
  }

  let devices: DisplayDevice[] | null = null
  let error: string | null = null

  try {
    devices = await getDisplayDevicesServer()
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat layar display.")
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
      <AdminPageHeader
        title="Layar Display"
        description="Daftarkan dan nonaktifkan layar antrian."
        icon={<MonitorPlay className="size-5" />}
      />

      {error || !devices ? (
        <Alert variant="destructive">
          <AlertTitle>Daftar layar tidak tersedia</AlertTitle>
          <AlertDescription>
            {error ?? "Terjadi kesalahan saat memuat layar display."}
          </AlertDescription>
        </Alert>
      ) : (
        <DisplayDeviceManager rows={devices} />
      )}
    </div>
  )
}
