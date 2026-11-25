import { describe, expect, it } from "vitest"

import type { NextRequest } from "next/server"

/** Read at module scope; set before the dynamic import for the same reason. */
process.env.APP_ORIGIN = "https://app-kiyu.test"

const { isSameOrigin, isStateChangingMethod } =
  await import("@/lib/auth/origin")

/**
 * Only `method` and `headers.get()` are read, so a plain `Request` stands in
 * for the Next request object.
 */
function request(method: string, origin?: string): NextRequest {
  return new Request("https://app-kiyu.test/api/x", {
    method,
    headers: origin ? { origin } : undefined,
  }) as unknown as NextRequest
}

describe("isSameOrigin", () => {
  it("allows a non-state-changing request with no Origin", () => {
    expect(isSameOrigin(request("GET"))).toBe(true)
  })

  it("rejects a state-changing request with no Origin", () => {
    expect(isSameOrigin(request("POST"))).toBe(false)
  })

  it("allows a state-changing request from the trusted origin", () => {
    expect(isSameOrigin(request("POST", "https://app-kiyu.test"))).toBe(true)
  })

  it("rejects a state-changing request from another origin", () => {
    expect(isSameOrigin(request("POST", "https://evil.test"))).toBe(false)
  })

  it("rejects a malformed Origin header", () => {
    expect(isSameOrigin(request("POST", "not a url"))).toBe(false)
  })
})

describe("isStateChangingMethod", () => {
  it("flags the mutating verbs only", () => {
    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
      expect(isStateChangingMethod(request(method))).toBe(true)
    }

    for (const method of ["GET", "HEAD", "OPTIONS"]) {
      expect(isStateChangingMethod(request(method))).toBe(false)
    }
  })
})
