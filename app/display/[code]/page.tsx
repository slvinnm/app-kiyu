import { DepartmentDisplay } from "@/components/display/department-display"
import { DisplayOnboarding } from "@/components/display/display-onboarding"

import { readUsableDeviceCredential } from "@/lib/device/session"

export const metadata = {
  title: "Antrian Departemen · Kiyu",
}

export const dynamic = "force-dynamic"

export default async function DepartmentDisplayPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const device = await readUsableDeviceCredential("display")

  if (!device) {
    return <DisplayOnboarding />
  }

  return (
    <DepartmentDisplay
      departmentCode={code}
      facilityId={device.device.facility.id}
    />
  )
}
