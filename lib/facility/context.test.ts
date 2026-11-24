import { describe, expect, it } from "vitest"

import { chooseFacilityId, resolveFacilityId } from "@/lib/facility/selection"

/**
 * Facility selection rules (PRD §2.4, §4.3).
 *
 * The backend refuses a facility-scoped request when it cannot tell which
 * facility is meant. The frontend must therefore never invent a choice among
 * several — acting at the wrong branch is a real operational error.
 */
describe("resolveFacilityId", () => {
  it("accepts an id the account can reach", () => {
    expect(resolveFacilityId("5", [5, 9])).toBe(5)
    expect(resolveFacilityId("5", [5, 9])).toBe(5)
  })

  it("refuses an id outside the account's reach", () => {
    expect(resolveFacilityId("12", [5, 9])).toBeNull()
    expect(resolveFacilityId("0", [5, 9])).toBeNull()
    expect(resolveFacilityId("-1", [5, 9])).toBeNull()
  })

  it("refuses malformed and missing values", () => {
    for (const value of ["abc", "1.5", "", null, undefined]) {
      expect(resolveFacilityId(value as string | null | undefined, [5])).toBeNull()
    }
  })
})

describe("chooseFacilityId", () => {
  it("auto-selects the only reachable facility", () => {
    expect(chooseFacilityId([7], null)).toBe(7)
  })

  it("never guesses between several", () => {
    expect(chooseFacilityId([7, 9], null)).toBeNull()
    expect(chooseFacilityId([7, 9], "")).toBeNull()
  })

  it("honours a valid stored choice when there are several", () => {
    expect(chooseFacilityId([7, 9], "9")).toBe(9)
  })

  it("ignores a stale stored choice", () => {
    // The user lost the assignment after selecting it.
    expect(chooseFacilityId([7, 9], "12")).toBeNull()
  })

  it("returns null when the account reaches none", () => {
    expect(chooseFacilityId([], "7")).toBeNull()
  })
})
