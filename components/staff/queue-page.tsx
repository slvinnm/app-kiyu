import { redirect } from "next/navigation"

import { StaffQueueWorkspace } from "@/components/staff/queue-workspace"

import { getSession } from "@/lib/auth/session"

export async function StaffQueuePage({ role }: { role: string }) {
  const session = await getSession()

  if (!session?.user?.role) {
    redirect("/login")
  }

  return (
    <StaffQueueWorkspace
      stationId={session.user.station_id ?? null}
      departmentId={session.user.department_id ?? null}
      facilityId={session.user.facility_id ?? null}
      actorEmail={session.user.email}
      role={role}
    />
  )
}
