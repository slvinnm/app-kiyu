import type { Session } from "@/lib/auth/session-core"

const API_BASE_URL = process.env.API_BASE_URL ?? ""

/** The subset of a user the session needs. Mirrors `toSessionUser`. */
export type VerifiedUser = {
  id: number
  name: string
  email: string
  role: string
  tenant_id: number | null
  /** Public tenant context; present for tenant users, `null` for platform. */
  tenant: {
    id: number
    name: string
    slug: string
    status: string | null
    timezone: string | null
  } | null
  /** Every facility the account may act at. The API sends an array; there is
   * no single `facility_id` on the payload. */
  facility_ids: number[]
  station_id: number | null
  profile?: unknown
}

type MeResponse = {
  data?: {
    id?: unknown
    name?: unknown
    email?: unknown
    role?: unknown
    tenant_id?: unknown
    tenant?: unknown
    facility_ids?: unknown
    station_id?: unknown
  }
}

function toTenant(value: unknown): VerifiedUser["tenant"] {
  if (typeof value !== "object" || value === null) {
    return null
  }

  const record = value as Record<string, unknown>

  if (typeof record.id !== "number" || typeof record.slug !== "string") {
    return null
  }

  return {
    id: record.id,
    name: typeof record.name === "string" ? record.name : "",
    slug: record.slug,
    status: typeof record.status === "string" ? record.status : null,
    timezone: typeof record.timezone === "string" ? record.timezone : null,
  }
}

function toVerifiedUser(data: MeResponse["data"]): VerifiedUser | null {
  if (!data || typeof data.role !== "string" || !data.role) {
    return null
  }

  if (typeof data.id !== "number" && typeof data.id !== "string") {
    return null
  }

  const optionalNumber = (value: unknown): number | null =>
    typeof value === "number" ? value : null

  // The API sends `facility_ids`; anything else is an empty reachable set, which
  // the facility selector reads as "no choice to make".
  const facilityIds = Array.isArray(data.facility_ids)
    ? data.facility_ids.filter((id): id is number => typeof id === "number")
    : []

  return {
    id: typeof data.id === "number" ? data.id : Number(data.id),
    name: typeof data.name === "string" ? data.name : "",
    email: typeof data.email === "string" ? data.email : "",
    role: data.role,
    tenant_id: optionalNumber(data.tenant_id),
    tenant: toTenant(data.tenant),
    facility_ids: facilityIds,
    station_id: optionalNumber(data.station_id),
  }
}

/**
 * Asks the API which user the token belongs to.
 *
 * The signed cookie only proves the token was issued — its `user` claims are a
 * snapshot from login time. A demoted, reassigned, or revoked account keeps the
 * stale claims for hours, so authorization (role, department, station) must read
 * from the API, which is the only authority on the current account state.
 *
 * Returns `null` when the API rejects the token (401/403); `undefined` when the
 * API is unreachable or returns an unusable payload, so callers can fall back
 * to the cookie claims instead of signing everyone out on a transient failure.
 */
export async function fetchVerifiedUser(
  session: Session
): Promise<VerifiedUser | null | undefined> {
  if (API_BASE_URL.length === 0) {
    throw new Error("API_BASE_URL is not configured.")
  }

  try {
    const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/auth/me`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${session.token}`,
      },
      cache: "no-store",
    })

    if (response.status === 401 || response.status === 403) {
      return null
    }

    if (!response.ok) {
      return undefined
    }

    const payload = (await response
      .json()
      .catch(() => null)) as MeResponse | null

    return toVerifiedUser(payload?.data) ?? undefined
  } catch {
    return undefined
  }
}
