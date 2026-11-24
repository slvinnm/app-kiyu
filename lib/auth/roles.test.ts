import { describe, expect, it } from "vitest"

import { ASSIGNABLE_ROLE_OPTIONS, staffRoleLabel } from "@/lib/admin/roles"
import { getRoleRedirect, roleApplication } from "@/lib/auth/redirect"
import {
  CAPABILITIES,
  USER_ROLES,
  hasCapability,
  normalizeRole,
} from "@/types/auth"

import type { UserRole } from "@/types/auth"

/**
 * The regression guard for the lockout: the API's six roles must all normalize
 * to themselves. Before this was fixed the union held `admin`/`receptionist`,
 * so every tenant_admin, facility_admin and operator normalized to `null` and
 * was redirected to /unauthorized.
 */
describe("role normalization", () => {
  it("round-trips every API role", () => {
    const apiRoles = [
      "platform_admin",
      "tenant_admin",
      "facility_admin",
      "operator",
      "staff",
      "client",
    ] as const

    for (const role of apiRoles) {
      expect(normalizeRole(role), role).toBe(role)
    }

    // And the union contains exactly those.
    expect([...USER_ROLES].sort()).toEqual([...apiRoles].sort())
  })

  it("is case- and whitespace-insensitive", () => {
    expect(normalizeRole("  TENANT_ADMIN ")).toBe("tenant_admin")
    expect(normalizeRole("Operator")).toBe("operator")
  })

  it("fails closed on unknown input", () => {
    for (const value of ["admin", "receptionist", "nurse", "", null, 42, {}]) {
      expect(normalizeRole(value), String(value)).toBeNull()
    }
  })
})

describe("role landing pages", () => {
  it("routes each role to its application dashboard", () => {
    expect(getRoleRedirect("platform_admin")).toBe("/platform/dashboard")
    expect(getRoleRedirect("tenant_admin")).toBe("/portal/dashboard")
    expect(getRoleRedirect("facility_admin")).toBe("/facility/dashboard")
    expect(getRoleRedirect("operator")).toBe("/operator/dashboard")
    expect(getRoleRedirect("staff")).toBe("/staff/dashboard")
    expect(getRoleRedirect("client")).toBe("/client/dashboard")
  })

  it("maps a role to the application it may use", () => {
    expect(roleApplication("platform_admin")).toBe("portal")
    expect(roleApplication("tenant_admin")).toBe("portal")
    expect(roleApplication("facility_admin")).toBe("workspace")
    expect(roleApplication("operator")).toBe("workspace")
    expect(roleApplication("staff")).toBe("workspace")
    expect(roleApplication("client")).toBe("workspace")
    expect(roleApplication(null)).toBeNull()
  })

  it("sends unknown roles to access denied", () => {
    expect(getRoleRedirect(null)).toBe("/unauthorized")
    expect(getRoleRedirect("admin")).toBe("/unauthorized")
  })
})

describe("capability matrix", () => {
  it("lets operators run reception but not staff", () => {
    expect(hasCapability("operator", "reception.operate")).toBe(true)
    expect(hasCapability("staff", "reception.operate")).toBe(false)
    expect(hasCapability("facility_admin", "reception.operate")).toBe(true)
  })

  it("keeps billing and audit owner-only", () => {
    expect(hasCapability("tenant_admin", "billing.manage")).toBe(true)
    expect(hasCapability("facility_admin", "billing.manage")).toBe(false)
    expect(hasCapability("tenant_admin", "audit.read")).toBe(true)
    expect(hasCapability("facility_admin", "audit.read")).toBe(false)
  })

  it("allows only the owner to create facilities", () => {
    expect(hasCapability("tenant_admin", "facilities.create")).toBe(true)
    expect(hasCapability("facility_admin", "facilities.create")).toBe(false)
  })

  it("grants service transfer to staff only", () => {
    expect(hasCapability("staff", "transfers.create")).toBe(true)
    expect(hasCapability("operator", "transfers.create")).toBe(false)
    expect(hasCapability("tenant_admin", "transfers.create")).toBe(false)
    expect(hasCapability("facility_admin", "transfers.create")).toBe(false)
  })

  it("never grants a capability to an unknown role", () => {
    expect(hasCapability(null, "admin.access")).toBe(false)
  })

  it("lists every capability against a known role", () => {
    for (const [name, roles] of Object.entries(CAPABILITIES)) {
      expect(roles.length, name).toBeGreaterThan(0)

      for (const role of roles) {
        expect(USER_ROLES, `${name} → ${role}`).toContain(role)
      }
    }
  })
})

describe("assignable roles", () => {
  it("never offers tenant_admin or platform_admin", () => {
    const values = ASSIGNABLE_ROLE_OPTIONS.map((option) => option.value)

    expect(values).not.toContain("tenant_admin")
    expect(values).not.toContain("platform_admin")
    expect(values).toContain("operator")
  })

  it("labels every API role, including the non-assignable ones", () => {
    for (const role of USER_ROLES) {
      expect(staffRoleLabel(role), role).not.toBe(role)
    }
  })
})

describe("role union typing", () => {
  it("narrows to the six known roles", () => {
    const role: UserRole = "facility_admin"

    // Compile-time proof that the union is exhaustive for the redirect table.
    expect(getRoleRedirect(role)).toBe("/facility/dashboard")
  })
})
