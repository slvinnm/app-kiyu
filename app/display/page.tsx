import { DisplayOnboarding } from "@/components/display/display-onboarding"
import { PublicDisplay } from "@/components/display/public-display"

import { readUsableDeviceCredential } from "@/lib/device/session"

export const metadata = {
  title: "Antrian Layanan · Kiyu",
}

export const dynamic = "force-dynamic"

export default async function DisplayPage() {
  const device = await readUsableDeviceCredential("display")

  if (!device) {
    return <DisplayOnboarding />
  }

  return <PublicDisplay facilityId={device.device.facility.id} />
}
