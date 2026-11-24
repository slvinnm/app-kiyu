import { describe, expect, it } from "vitest"

import { STATION_TYPES, stationTypeLabel } from "@/lib/reception/format"

/**
 * Station types must mirror `App\Enums\StationType`. The UI used to offer
 * clinical values (`NURSE`, `DOCTOR`, …) that the API rejected with 422, so
 * every station creation from the UI failed.
 */
describe("station types", () => {
  it("exposes exactly the four backend values", () => {
    expect([...STATION_TYPES].sort()).toEqual([
      "CASHIER",
      "COUNTER",
      "INTAKE",
      "SERVICE",
    ])
  })

  it("labels each known type in Indonesian", () => {
    expect(stationTypeLabel("INTAKE")).toBe("Intake")
    expect(stationTypeLabel("SERVICE")).toBe("Layanan")
    expect(stationTypeLabel("CASHIER")).toBe("Kasir")
    expect(stationTypeLabel("COUNTER")).toBe("Loket")
  })

  it("shows an unknown value verbatim instead of hiding it", () => {
    // A backend enum addition should be visible, not silently blank.
    expect(stationTypeLabel("NURSE")).toBe("NURSE")
  })

  it("returns a dash for no value", () => {
    expect(stationTypeLabel(null)).toBe("-")
    expect(stationTypeLabel(undefined)).toBe("-")
  })
})
