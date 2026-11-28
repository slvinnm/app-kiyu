import { describe, it, expect } from "vitest"
import { resolveHost, normalizeHostname } from "./resolve-host"

describe("normalizeHostname", () => {
  it("strips port and normalizes lowercase", () => {
    expect(normalizeHostname("App.Kiyu.Test:3000")).toBe("app.kiyu.test")
    expect(normalizeHostname("klinik-a.kiyu.test")).toBe("klinik-a.kiyu.test")
    expect(normalizeHostname(null)).toBe("")
  })
})

describe("resolveHost", () => {
  it("routes kiyu.test to public context", () => {
    expect(resolveHost("kiyu.test", "/")).toEqual({
      context: "public",
      internalBasePath: "/ctx/public",
    })
    expect(resolveHost("www.kiyu.test", "/pricing")).toEqual({
      context: "public",
      internalBasePath: "/ctx/public",
    })
  })

  it("routes app.kiyu.test to app context", () => {
    expect(resolveHost("app.kiyu.test", "/login")).toEqual({
      context: "app",
      internalBasePath: "/ctx/app",
    })
  })

  it("routes portal.kiyu.test to portal context", () => {
    expect(resolveHost("portal.kiyu.test", "/dashboard")).toEqual({
      context: "portal",
      internalBasePath: "/ctx/portal",
    })
  })

  it("routes {tenant}.kiyu.test to tenant, customer, and device contexts", () => {
    expect(resolveHost("klinik-a.kiyu.test", "/login")).toEqual({
      context: "tenant",
      tenantSlug: "klinik-a",
      internalBasePath: "/ctx/tenant",
    })

    expect(resolveHost("klinik-a.kiyu.test", "/customer/book")).toEqual({
      context: "customer",
      tenantSlug: "klinik-a",
      internalBasePath: "/ctx/customer",
    })

    expect(resolveHost("klinik-a.kiyu.test", "/kiosk")).toEqual({
      context: "devices",
      tenantSlug: "klinik-a",
      internalBasePath: "/ctx/devices",
    })

    expect(resolveHost("klinik-a.kiyu.test", "/display")).toEqual({
      context: "devices",
      tenantSlug: "klinik-a",
      internalBasePath: "/ctx/devices",
    })
  })

  it("rejects reserved subdomains and nested subdomains", () => {
    expect(resolveHost("api.kiyu.test", "/")).toBeNull()
    expect(resolveHost("a.b.kiyu.test", "/")).toBeNull()
    expect(resolveHost("unknown.example.com", "/")).toBeNull()
  })
})
