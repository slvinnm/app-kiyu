import { describe, expect, it } from "vitest"

import { isGatedPath, routeContextOf } from "@/lib/auth/route-access"

describe("isGatedPath", () => {
  it("gates the portal and workspace roots and their children", () => {
    for (const path of [
      "/platform",
      "/platform/tenants",
      "/portal",
      "/portal/dashboard",
      "/facility",
      "/facility/users",
      "/operator",
      "/operator/queue",
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
      "/marketing",
    ]) {
      expect(isGatedPath(path), path).toBe(false)
    }
  })

  it("classifies the application context of a path", () => {
    expect(routeContextOf("/platform/dashboard")).toBe("portal")
    expect(routeContextOf("/portal/facilities")).toBe("portal")
    expect(routeContextOf("/facility/dashboard")).toBe("workspace")
    expect(routeContextOf("/staff/queue")).toBe("workspace")
    expect(routeContextOf("/login")).toBeNull()
  })

  it("marks kiosk, display and tracking as tenant-public (not gated by a session)", () => {
    for (const path of ["/kiosk", "/display", "/display/MAIN", "/track/abc"]) {
      expect(routeContextOf(path), path).toBe("tenant-public")
      // They require a tenant host, but are not behind a login cookie.
      expect(isGatedPath(path), path).toBe(false)
    }
  })

  it("matches on a segment boundary, not a prefix", () => {
    expect(isGatedPath("/platformx")).toBe(false)
    expect(isGatedPath("/portals")).toBe(false)
    expect(isGatedPath("/clients")).toBe(false)
    expect(isGatedPath("/staffing")).toBe(false)
  })
})
