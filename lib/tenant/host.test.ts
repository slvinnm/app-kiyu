import { describe, expect, it } from "vitest"

import {
  classifyHost,
  isMarketingHost,
  isPortalHost,
  tenantSlugFromHost,
} from "./host"

describe("classifyHost", () => {
  it("classifies the application hosts", () => {
    expect(classifyHost("kiyu.test")).toEqual({ kind: "marketing" })
    expect(classifyHost("app.kiyu.test")).toEqual({ kind: "portal" })
    expect(classifyHost("api.kiyu.test")).toEqual({ kind: "api" })
  })

  it("extracts a tenant slug from a single-label subdomain", () => {
    expect(classifyHost("acme.kiyu.test")).toEqual({
      kind: "tenant",
      slug: "acme",
    })
    expect(classifyHost("kiyu-demo.kiyu.test")).toEqual({
      kind: "tenant",
      slug: "kiyu-demo",
    })
  })

  it("ignores ports and case", () => {
    expect(classifyHost("Acme.KIYU.test:80")).toEqual({
      kind: "tenant",
      slug: "acme",
    })
    expect(classifyHost("APP.KIYU.TEST")).toEqual({ kind: "portal" })
  })

  it("reserves infrastructure labels so they are never tenants", () => {
    for (const label of [
      "www",
      "admin",
      "support",
      "docs",
      "status",
      "static",
      "assets",
    ]) {
      expect(classifyHost(`${label}.kiyu.test`)).toEqual({ kind: "unknown" })
    }
  })

  it("rejects foreign, nested and malformed hosts", () => {
    expect(classifyHost("acme.kiyu.test.evil.com")).toEqual({ kind: "unknown" })
    expect(classifyHost("acme.example.test")).toEqual({ kind: "unknown" })
    expect(classifyHost("a.b.kiyu.test")).toEqual({ kind: "unknown" })
    expect(classifyHost("acme_1.kiyu.test")).toEqual({ kind: "unknown" })
    expect(classifyHost("localhost:3000")).toEqual({ kind: "unknown" })
    expect(classifyHost(null)).toEqual({ kind: "unknown" })
    expect(classifyHost("")).toEqual({ kind: "unknown" })
  })
})

describe("tenantSlugFromHost", () => {
  it("returns the slug only for a tenant host", () => {
    expect(tenantSlugFromHost("acme.kiyu.test")).toBe("acme")
    expect(tenantSlugFromHost("app.kiyu.test")).toBeNull()
    expect(tenantSlugFromHost("kiyu.test")).toBeNull()
    expect(tenantSlugFromHost(null)).toBeNull()
  })
})

describe("host predicates", () => {
  it("separates marketing and portal hosts", () => {
    expect(isMarketingHost("kiyu.test")).toBe(true)
    expect(isMarketingHost("app.kiyu.test")).toBe(false)
    expect(isPortalHost("app.kiyu.test")).toBe(true)
    expect(isPortalHost("acme.kiyu.test")).toBe(false)
    expect(isPortalHost("kiyu.test")).toBe(false)
  })
})
