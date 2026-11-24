import type { Session } from "@/lib/auth/session-core"

const API_BASE_URL = process.env.API_BASE_URL ?? ""

/** The subset of a user the session needs. Mirrors `toSessionUser`. */
export type VerifiedUser = {
  id: number
  name: string
  email: string
  role: string
  tenant_id?: number | null
  facility_id?: number | null
  department_id?: number | null
  station_id?: number | null
}

type MeResponse = {
  data?: {
    id?: unknown
    name?: unknown
    email?: unknown
    role?: unknown
    tenant_id?: unknown
    facility_id?: unknown
    department_id?: unknown
    station_id?: unknown
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

  return {
    id: typeof data.id === "number" ? data.id : Number(data.id),
    name: typeof data.name === "string" ? data.name : "",
    email: typeof data.email === "string" ? data.email : "",
    role: data.role,
    tenant_id: optionalNumber(data.tenant_id),
    facility_id: optionalNumber(data.facility_id),
    department_id: optionalNumber(data.department_id),
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
 * API is unreachable, so callers can decide between "fail open" (the gated page
 * will fail on its own requests) and "fail closed".
 */
export async function fetchVerifiedUser(
  session: Session
): Promise<VerifiedUser | null | undefined> {
  if (API_BASE_URL.length === 0) {
    throw new Error("API_BASE_URL is not configured.")
  }

  try {
    const response = await fetch(
      `${API_BASE_URL.replace(/\/$/, "")}/auth/me`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${session.token}`,
        },
        cache: "no-store",
      }
    )

    if (response.status === 401 || response.status === 403) {
      return null
    }

    if (!response.ok) {
      return undefined
    }

    const payload = (await response.json().catch(() => null)) as
      | MeResponse
      | null

    return toVerifiedUser(payload?.data)
  } catch {
    return undefined
  }
}
