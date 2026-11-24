import "server-only"

import { cache } from "react"
import { headers } from "next/headers"

import { classifyHost, requestHostname } from "@/lib/tenant/host"

const API_BASE_URL = process.env.API_BASE_URL ?? ""

if (API_BASE_URL.length === 0) {
  throw new Error("API_BASE_URL is not configured.")
}

export type PublicTenant = {
  id: number
  name: string
  slug: string
  status: string
  timezone: string | null
  allow_public_registration: boolean
}

export type TenantResolution =
  | { kind: "tenant"; tenant: PublicTenant }
  /** Tenant exists but is suspended/pending/cancelled (HTTP 403). */
  | { kind: "unavailable"; slug: string; status: string }
  /** No such tenant (HTTP 404). */
  | { kind: "not-found"; slug: string }
  /** The host is not a tenant subdomain. */
  | { kind: "not-a-tenant" }

/**
 * Resolve the tenant carried by the current request's hostname (PRD §7).
 *
 * The hostname selects the context; the API is the source of truth for whether
 * that tenant exists and is publicly available. Successful resolution is *not*
 * authentication — every protected endpoint re-checks membership.
 */
export const resolveCurrentTenant = cache(
  async (): Promise<TenantResolution> => {
    const host = classifyHost(requestHostname(await headers()))

    if (host.kind !== "tenant") {
      return { kind: "not-a-tenant" }
    }

    return resolveTenantBySlug(host.slug)
  }
)

/** Resolve one tenant by slug through the public API. */
export async function resolveTenantBySlug(
  slug: string
): Promise<TenantResolution> {
  let response: Response

  try {
    response = await fetch(
      `${API_BASE_URL.replace(/\/$/, "")}/public/tenant/${encodeURIComponent(slug)}`,
      { headers: { Accept: "application/json" }, cache: "no-store" }
    )
  } catch {
    // A network failure is not a "tenant missing" answer; surface it as
    // not-found so the UI shows an error state rather than a stale tenant.
    return { kind: "not-found", slug }
  }

  if (response.status === 404) {
    return { kind: "not-found", slug }
  }

  if (response.status === 403) {
    const payload = (await response.json().catch(() => null)) as {
      data?: { status?: string }
    } | null

    return {
      kind: "unavailable",
      slug,
      status: payload?.data?.status ?? "UNAVAILABLE",
    }
  }

  if (!response.ok) {
    return { kind: "not-found", slug }
  }

  const payload = (await response.json().catch(() => null)) as {
    data?: PublicTenant
  } | null

  if (!payload?.data?.slug) {
    return { kind: "not-found", slug }
  }

  return { kind: "tenant", tenant: payload.data }
}
