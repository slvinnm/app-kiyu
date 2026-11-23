import type { Session } from "@/lib/auth/session-core"

const API_BASE_URL = process.env.API_BASE_URL ?? ""

/**
 * Confirms the API still accepts the session's bearer token.
 *
 * The signed cookie only proves the token was issued — it cannot prove the
 * token still exists. An admin deleting the row in `personal_access_tokens`,
 * or the token expiring server-side, leaves the cookie valid for hours. Every
 * gated request therefore asks the API, which is the only authority on whether
 * a token is revoked.
 *
 * Network failures count as valid: an API outage must not sign everyone out,
 * and the gated pages fail on their own requests anyway.
 */
export async function isSessionTokenValid(session: Session): Promise<boolean> {
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

    if (response.status === 401) {
      return false
    }

    return response.ok
  } catch {
    return true
  }
}
