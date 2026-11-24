import { describe, expect, it } from "vitest"

import { isGatedPath } from "@/lib/auth/route-access"

describe("isGatedPath", () => {
  it("gates the workspace roots and their children", () => {
    for (const path of [
      "/admin",
      "/admin/users",
      "/receptionist",
      "/receptionist/queue",
      "/staff",
      "/staff/dashboard",
      "/client",
      "/client/dashboard",
    ]) {
      expect(isGatedPath(path), path).toBe(true)
    }
  })

  it("leaves public routes open", () => {
    for (const path of [
      "/",
      "/login",
      "/signup",
      "/kiosk",
      "/display",
      "/display/MAIN",
      "/track/abc123",
      "/unauthorized",
    ]) {
      expect(isGatedPath(path), path).toBe(false)
    }
  })

  it("matches on a segment boundary, not a prefix", () => {
    expect(isGatedPath("/administrator")).toBe(false)
    expect(isGatedPath("/clients")).toBe(false)
    expect(isGatedPath("/staffing")).toBe(false)
  })
})
