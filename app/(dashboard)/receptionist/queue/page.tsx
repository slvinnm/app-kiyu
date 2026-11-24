import { redirect } from "next/navigation"

import { ReceptionQueueWorkspace } from "@/components/receptionist/queue/reception-queue-workspace"

import { requireRole } from "@/lib/auth/guard"

export default async function Page() {
  const user = await requireRole(["admin", "receptionist"])

  // The operator works at the department/station assigned to their account;
  // no department picker is needed.
  return (
    <ReceptionQueueWorkspace
      departmentId={user.department_id ?? null}
      facilityId={user.facility_id ?? null}
      actorEmail={user.email}
    />
  )
}
