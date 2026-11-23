import { redirect } from "next/navigation"

import { ReceptionQueueWorkspace } from "@/components/receptionist/queue/reception-queue-workspace"

import { getSession } from "@/lib/auth/session"

export default async function Page() {
  const session = await getSession()

  if (!session?.user?.role) {
    redirect("/login")
  }

  // The operator works at the department/station assigned to their account;
  // no department picker is needed.
  return (
    <ReceptionQueueWorkspace
      departmentId={session.user.department_id ?? null}
      facilityId={session.user.facility_id ?? null}
      actorEmail={session.user.email}
    />
  )
}
