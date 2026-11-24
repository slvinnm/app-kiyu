import { redirect } from "next/navigation"

import { StaffQueueWorkspace } from "@/components/staff/queue-workspace"

import { getStationOptionsServer } from "@/lib/api/reception-server"
import { getSession } from "@/lib/auth/session"

export async function StaffQueuePage({ role }: { role: string }) {
  const session = await getSession()

  if (!session?.user?.role) {
    redirect("/login")
  }

  // The station carries the department; the user record does not.
  let departmentId: number | null = null

  if (session.user.station_id) {
    try {
      const stations = await getStationOptionsServer()
      departmentId =
        stations.find((station) => station.id === session.user.station_id)
          ?.department_id ?? null
    } catch {
      departmentId = null
    }
  }

  return (
    <StaffQueueWorkspace
      stationId={session.user.station_id ?? null}
      departmentId={departmentId}
      facilityId={session.user.facility_ids?.[0] ?? null}
      actorEmail={session.user.email}
      role={role}
    />
  )
}
