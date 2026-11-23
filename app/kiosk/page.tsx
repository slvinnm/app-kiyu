import { KioskClient } from "@/components/kiosk/kiosk-client"
import { KioskOnboarding } from "@/components/kiosk/kiosk-onboarding"

import { readUsableDeviceCredential } from "@/lib/device/session"

export const dynamic = "force-dynamic"

export default async function KioskPage() {
  const device = await readUsableDeviceCredential("kiosk")

  if (!device) {
    return <KioskOnboarding />
  }

  return <KioskClient />
}
