import { ReceptionQueueWorkspace } from "@/components/receptionist/queue/reception-queue-workspace"

import { getStationOptionsServer } from "@/lib/api/reception-server"
import { requireRole } from "@/lib/auth/guard"

export default async function Page() {
  const user = await requireRole(["tenant_admin", "facility_admin", "operator"])

  // The operator works at the station assigned to their account, and the
  // station carries the department. No picker is needed for the common case.
  let departmentId: number | null = null

  if (user.station_id !== null) {
    try {
      const stations = await getStationOptionsServer()
      departmentId =
        stations.find((station) => station.id === user.station_id)?.department_id ??
        null
    } catch {
      departmentId = null
    }
  }

  return (
    <ReceptionQueueWorkspace
      departmentId={departmentId}
      facilityId={user.facility_ids[0] ?? null}
      actorEmail={user.email}
    />
  )
}
