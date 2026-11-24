import { describe, expect, it } from "vitest"

/**
 * The module reads `AUTH_SECRET` at import time and throws when it is empty,
 * so the value must be set before the dynamic import — `beforeAll` would run
 * too late, because a top-level `await import` executes during collection.
 */
process.env.AUTH_SECRET = "test-secret-not-a-real-credential"

const {
  SESSION_COOKIE_NAME,
  parseSession,
  readSessionFromCookieHeader,
  serializeSession,
} = await import("@/lib/auth/session-core")

const session = {
  token: "1|plain-text-token",
  context: "tenant_workspace" as const,
  user: {
    id: 7,
    name: "Test Operator",
    email: "operator@example.test",
    role: "operator",
    tenant_id: 3,
    station_id: null,
  },
}

describe("session cookie", () => {
  it("round-trips a signed session", () => {
    const parsed = parseSession(serializeSession(session))

    expect(parsed?.token).toBe(session.token)
    expect(parsed?.context).toBe("tenant_workspace")
    expect(parsed?.user.role).toBe("operator")
    expect(parsed?.user.tenant_id).toBe(3)
  })

  it("rejects a tampered payload", () => {
    const encoded = serializeSession(session)
    const [payload, signature] = encoded.split(".")
    const flipped = `${payload.slice(0, -2)}AA.${signature}`

    expect(parseSession(flipped)).toBeNull()
  })

  it("rejects malformed and empty values without throwing", () => {
    for (const value of ["", "abc", "a.b.c", null, undefined]) {
      expect(() => parseSession(value)).not.toThrow()
      expect(parseSession(value)).toBeNull()
    }
  })

  it("rejects a signature that is not the payload's HMAC", () => {
    expect(parseSession("eyJ0b2tlbiI6IngifQ.not-a-signature")).toBeNull()
  })

  it("rejects a session without a known application context", () => {
    const { context: _context, ...withoutContext } = session

    expect(parseSession(serializeSession(withoutContext as never))).toBeNull()
  })
})

describe("cookie header parsing", () => {
  it("reads a single well-formed cookie", () => {
    const header = `${SESSION_COOKIE_NAME}=${encodeURIComponent(serializeSession(session))}`

    expect(readSessionFromCookieHeader(header)?.user.id).toBe(7)
  })

  it("rejects two cookies with the session name (cookie tossing)", () => {
    const value = encodeURIComponent(serializeSession(session))
    const header = `${SESSION_COOKIE_NAME}=${value}; ${SESSION_COOKIE_NAME}=${value}`

    expect(readSessionFromCookieHeader(header)).toBeNull()
  })

  it("ignores unrelated cookies", () => {
    const value = encodeURIComponent(serializeSession(session))
    const header = `theme=dark; ${SESSION_COOKIE_NAME}=${value}; lang=en`

    expect(readSessionFromCookieHeader(header)?.user.id).toBe(7)
  })

  it("returns null for an empty header", () => {
    expect(readSessionFromCookieHeader(null)).toBeNull()
    expect(readSessionFromCookieHeader("")).toBeNull()
  })
})
