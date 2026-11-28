import { http, ApiException } from "@/lib/api/transport"
import { TenantPublicInfo } from "@/lib/host-routing/resolve-host"

export type TenantLookupResult =
  | { state: "ACTIVE"; tenant: TenantPublicInfo }
  | { state: "UNAVAILABLE" }
  | { state: "NOT_FOUND" }

/**
 * Validate tenant via public API and return status + public metadata
 */
export async function lookupTenant(slug: string): Promise<TenantLookupResult> {
  try {
    const response = await http<{ data: TenantPublicInfo }>(
      `/tenants/${encodeURIComponent(slug)}`,
      {
        context: "public",
      }
    )
    if (response.data.status !== "ACTIVE") {
      return { state: "UNAVAILABLE" }
    }
    return { state: "ACTIVE", tenant: response.data }
  } catch (error: unknown) {
    if (error instanceof ApiException) {
      if (error.status === 404) {
        return { state: "NOT_FOUND" }
      }
      if (error.status === 403) {
        return { state: "UNAVAILABLE" }
      }
    }
    throw error
  }
}

export async function validateTenant(
  slug: string
): Promise<TenantPublicInfo | null> {
  const result = await lookupTenant(slug)
  return result.state === "ACTIVE" ? result.tenant : null
}
