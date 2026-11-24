import "server-only"

import { cookies } from "next/headers"

import { getVerifiedUser } from "@/lib/auth/guard"
import { FACILITY_COOKIE_NAME } from "@/lib/facility/context"
import { chooseFacilityId } from "@/lib/facility/selection"

/**
 * The facility id to send on a server-side API request, or `null` when the
 * account reaches none (or several and has not chosen).
 *
 * Kept separate from `getFacilityContext` so `lib/api/server.ts` does not pull
 * in the whole context module (and its guard chain) just to read one value.
 */
export async function getActiveFacilityId(): Promise<number | null> {
  const user = await getVerifiedUser()

  if (!user) {
    return null
  }

  const cookieStore = await cookies()
  const stored = cookieStore.get(FACILITY_COOKIE_NAME)?.value ?? null

  return chooseFacilityId(user.facility_ids, stored)
}
