/**
 * Facility selection rules.
 *
 * Pure functions, no `next/headers`, so they are testable and reusable from the
 * browser bundle if a client component ever needs to mirror the rule. The
 * server wiring lives in `lib/facility/context.ts`.
 *
 * The invariant: never invent a choice among several facilities. A user who
 * reaches two branches must say which one, because acting at the wrong branch
 * is a real operational error (PRD §2.4, §4.3).
 */

/** Validates a raw value against the account's reachable facilities. */
export function resolveFacilityId(
  raw: string | null | undefined,
  facilityIds: readonly number[]
): number | null {
  if (!raw) {
    return null
  }

  const parsed = Number(raw)

  return Number.isInteger(parsed) && facilityIds.includes(parsed)
    ? parsed
    : null
}

/**
 * Picks the active facility.
 *
 * Zero → nothing. One → that one, auto-selected only after the account is
 * verified. Several → the stored choice if it is still valid, otherwise `null`
 * so the UI asks instead of guessing.
 */
export function chooseFacilityId(
  facilityIds: readonly number[],
  stored: string | null | undefined
): number | null {
  if (facilityIds.length === 0) {
    return null
  }

  if (facilityIds.length === 1) {
    return facilityIds[0]
  }

  return resolveFacilityId(stored, facilityIds)
}
