import "server-only"

import { ApiError } from "@/lib/api/error"
import { normalisePayload } from "@/lib/api/normalize"
import { getLaravelAccessToken } from "@/lib/auth/server"
import { getSession } from "@/lib/auth/session"
import { getActiveFacilityId } from "@/lib/facility/server"
import { normalizeRole } from "@/types/auth"

const API_BASE_URL = process.env.API_BASE_URL ?? ""

if (!API_BASE_URL) {
  throw new Error("API_BASE_URL is not configured.")
}

/** Paths that already carry their application prefix (or are cross-cutting). */
const PREFIXED_ROOTS = ["platform/", "portal/", "public/", "auth/"]

/**
 * Resolve the path for the current session's application context.
 *
 * TenantAdmin signs in to the Platform Portal, where its endpoints live under
 * `/portal/*`. Pages reuse the same API client calls as the tenant workspace
 * (`/customers`, `/facilities`, …); this rewrites them to the portal prefix so
 * there is one client and one set of page components. FacilityAdmin and the
 * other workspace roles keep the tenant API exactly as before.
 */
async function contextualPath(path: string): Promise<string> {
  const clean = path.replace(/^\//, "")

  if (PREFIXED_ROOTS.some((root) => clean.startsWith(root))) {
    return clean
  }

  const session = await getSession()

  if (
    session?.context === "platform_portal" &&
    normalizeRole(session.user.role) === "tenant_admin"
  ) {
    return `portal/${clean}`
  }

  return clean
}

/**
 * Server-side fetch straight to the Laravel API with the session's bearer
 * token. Used by server components; never callable from the browser.
 */
export async function serverApiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const token = await getLaravelAccessToken()

  if (!token) {
    throw new ApiError(401, "Unauthenticated.", null)
  }

  const target = await contextualPath(path)

  // The API requires an unambiguous facility for facility-scoped routes when
  // the account can reach several. An explicit `X-Facility-Id` in `init` wins.
  const facilityId = await getActiveFacilityId()

  const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/${target}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(facilityId !== null ? { "X-Facility-Id": String(facilityId) } : {}),
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  })

  const payload: unknown = await response
    .json()
    .catch(() => ({ message: "Respons tidak valid." }))

  if (!response.ok) {
    throw new ApiError(
      response.status,
      (payload as { message?: string })?.message ?? "Permintaan gagal.",
      payload
    )
  }

  return normalisePayload(payload) as T
}
