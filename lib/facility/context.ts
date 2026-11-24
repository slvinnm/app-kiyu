import "server-only"

import { cookies } from "next/headers"

import { getVerifiedUser } from "@/lib/auth/guard"
import { chooseFacilityId } from "@/lib/facility/selection"

/**
 * The active facility for this request, resolved from the verified account.
 *
 * A tenant can have several branches and one person may work at more than one.
 * The choice is a UI preference stored in a cookie and re-validated against the
 * account's real assignments on every request — never trusted as authorization
 * on its own (PRD §2.4, §4.3). The selection rules live in
 * `lib/facility/selection.ts`.
 */
export const FACILITY_COOKIE_NAME = "kiyu_facility"

export type FacilityContext = {
  /** Facilities the account can reach, in the order the API returned them. */
  facilityIds: number[]
  /** The selected facility, or `null` when the user must still choose. */
  activeId: number | null
  /** True when the choice is unambiguous (zero or one facility). */
  isForced: boolean
}

/** Server-side read: the facility context for the current request. */
export async function getFacilityContext(): Promise<FacilityContext> {
  const user = await getVerifiedUser()

  const facilityIds = user?.facility_ids ?? []

  if (!user) {
    return { facilityIds, activeId: null, isForced: true }
  }

  const cookieStore = await cookies()
  const stored = cookieStore.get(FACILITY_COOKIE_NAME)?.value ?? null

  return {
    facilityIds,
    activeId: chooseFacilityId(facilityIds, stored),
    isForced: facilityIds.length <= 1,
  }
}
