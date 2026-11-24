import { describe, expect, it } from "vitest"

import { isMarketingHost, tenantSlugFromHost } from "./host"

describe("tenantSlugFromHost", () => {
  it("takes the single label of a tenant host", () => {
    expect(tenantSlugFromHost("acme.kiyu.test")).toBe("acme")
    expect(tenantSlugFromHost("beta.kiyu.test")).toBe("beta")
    expect(tenantSlugFromHost("kiyu-demo.kiyu.test")).toBe("kiyu-demo")
  })

  it("ignores ports and case", () => {
    expect(tenantSlugFromHost("Acme.KIYU.test:80")).toBe("acme")
  })

  it("treats application hosts as non-tenant", () => {
    expect(tenantSlugFromHost("kiyu.test")).toBeNull()
    expect(tenantSlugFromHost("app.kiyu.test")).toBeNull()
    expect(tenantSlugFromHost("api.kiyu.test")).toBeNull()
    expect(tenantSlugFromHost("www.kiyu.test")).toBeNull()
    expect(tenantSlugFromHost("localhost:3000")).toBeNull()
    expect(tenantSlugFromHost(null)).toBeNull()
  })

  it("rejects foreign or nested hosts", () => {
    expect(tenantSlugFromHost("acme.kiyu.test.evil.com")).toBeNull()
    expect(tenantSlugFromHost("acme.example.test")).toBeNull()
    expect(tenantSlugFromHost("a.b.kiyu.test")).toBeNull()
    expect(tenantSlugFromHost("acme_1.kiyu.test")).toBeNull()
  })
})

describe("isMarketingHost", () => {
  it("is true only for the bare host", () => {
    expect(isMarketingHost("kiyu.test")).toBe(true)
    expect(isMarketingHost("kiyu.test:80")).toBe(true)
    expect(isMarketingHost("app.kiyu.test")).toBe(false)
    expect(isMarketingHost("acme.kiyu.test")).toBe(false)
    expect(isMarketingHost("localhost:3000")).toBe(false)
  })
})
