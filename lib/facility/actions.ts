"use server"

import { cookies } from "next/headers"

import { FACILITY_COOKIE_NAME } from "@/lib/facility/context"
import { resolveFacilityId } from "@/lib/facility/selection"
import { getVerifiedUser } from "@/lib/auth/guard"

export type FacilitySelectionResult = { ok: true } | { ok: false; message: string }

/**
 * Persist the active facility for the current session.
 *
 * The value is validated against the account's real assignments, so a tampered
 * form field or a stale UI can only ever select a facility the backend will
 * also accept — or be refused here. The cookie is a preference, never a grant.
 */
export async function selectFacility(
  facilityId: unknown
): Promise<FacilitySelectionResult> {
  const user = await getVerifiedUser()

  if (!user) {
    return { ok: false, message: "Sesi berakhir. Muat ulang halaman." }
  }

  const requested = typeof facilityId === "number" ? String(facilityId) : String(facilityId ?? "")
  const resolved = resolveFacilityId(requested, user.facility_ids)

  if (resolved === null) {
    return { ok: false, message: "Fasilitas tidak tersedia untuk akun Anda." }
  }

  const cookieStore = await cookies()

  cookieStore.set(FACILITY_COOKIE_NAME, String(resolved), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })

  return { ok: true }
}
