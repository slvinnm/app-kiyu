import { redirect } from "next/navigation"

import { ClinicalQueueWorkspace } from "@/components/clinical/clinical-queue-workspace"

import { getSession } from "@/lib/auth/session"

export async function ClinicalQueuePage({ role }: { role: string }) {
  const session = await getSession()

  if (!session?.user?.role) {
    redirect("/login")
  }

  return (
    <ClinicalQueueWorkspace
      stationId={session.user.station_id ?? null}
      departmentId={session.user.department_id ?? null}
      actorEmail={session.user.email}
      role={role}
    />
  )
}
