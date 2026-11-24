import { NextRequest, NextResponse } from "next/server"

import { FACILITY_COOKIE_NAME } from "@/lib/facility/context"
import { resolveFacilityId } from "@/lib/facility/selection"
import { getVerifiedUser } from "@/lib/auth/guard"
import { SESSION_COOKIE_NAME, readSessionFromRequest } from "@/lib/auth/session-core"
import { isSameOrigin, isStateChangingMethod } from "@/lib/auth/origin"
import { getLaravelAccessTokenFromRequest } from "@/lib/auth/server"

const API_BASE_URL = process.env.API_BASE_URL ?? ""

if (API_BASE_URL.length === 0) {
  throw new Error("API_BASE_URL is not configured.")
}

const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD"])

const ALLOWED_RESPONSE_HEADERS = [
  "content-type",
  "content-disposition",
  "cache-control",
]

/** Paths that already carry their application prefix (or are cross-cutting). */
const PREFIXED_ROOTS = ["platform/", "portal/", "public/", "auth/"]

/**
 * Rewrite the path for the current session's application context.
 *
 * TenantAdmin sessions live in the Platform Portal (`/portal/*`); the pages
 * call the same tenant-shaped paths as the workspace, so prefix them. Other
 * contexts pass through unchanged.
 */
async function contextualPath(
  path: string,
  request: NextRequest
): Promise<string> {
  if (PREFIXED_ROOTS.some((root) => path.startsWith(root))) {
    return path
  }

  const session = readSessionFromRequest(request)

  if (session?.context === "platform_portal") {
    return `portal/${path}`
  }

  return path
}

async function proxy(request: NextRequest) {
  if (isStateChangingMethod(request) && !isSameOrigin(request)) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid request origin.",
      },
      {
        status: 403,
      }
    )
  }

  const accessToken = await getLaravelAccessTokenFromRequest(request)

  if (!accessToken) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthenticated.",
      },
      {
        status: 401,
      }
    )
  }

  const rawPath = request.nextUrl.pathname
    .replace(/^\/api\/backend\/?/, "")
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/")

  // TenantAdmin signs in to the Platform Portal; its endpoints live under
  // `/portal/*`. Browser components reuse the same client calls as the tenant
  // workspace, so the proxy rewrites them for that context. Everything else is
  // forwarded verbatim.
  const path = await contextualPath(rawPath, request)

  const targetUrl = `${API_BASE_URL.replace(/\/$/, "")}/${path}${request.nextUrl.search}`

  const headers = new Headers()

  headers.set("Accept", "application/json")
  headers.set("Authorization", `Bearer ${accessToken}`)

  // The chosen facility is re-validated against the account before it is
  // forwarded: a stale or tampered cookie must not be able to name a branch the
  // user cannot reach. An explicit header on the browser request wins.
  const facilityId = await resolveFacilityForRequest(request, accessToken)

  if (facilityId !== null) {
    headers.set("X-Facility-Id", String(facilityId))
  }

  const contentType = request.headers.get("content-type")

  if (contentType) {
    headers.set("Content-Type", contentType)
  }

  const init: RequestInit & {
    duplex?: "half"
  } = {
    method: request.method,
    headers,
    cache: "no-store",
  }

  if (!METHODS_WITHOUT_BODY.has(request.method)) {
    init.body = request.body
    init.duplex = "half"
  }

  const response = await fetch(targetUrl, init)

  const responseHeaders = new Headers()

  for (const header of ALLOWED_RESPONSE_HEADERS) {
    const value = response.headers.get(header)

    if (value) {
      responseHeaders.set(header, value)
    }
  }

  const out = new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  })

  // The API rejected the token: it was revoked or expired. Drop the session
  // cookie so the next page load sends the browser to the login page instead
  // of leaving a dead session signed in.
  if (response.status === 401) {
    out.cookies.delete(SESSION_COOKIE_NAME)
  }

  return out
}

export async function GET(request: NextRequest) {
  return proxy(request)
}

export async function POST(request: NextRequest) {
  return proxy(request)
}

export async function PUT(request: NextRequest) {
  return proxy(request)
}

export async function PATCH(request: NextRequest) {
  return proxy(request)
}

export async function DELETE(request: NextRequest) {
  return proxy(request)
}

export async function HEAD(request: NextRequest) {
  return proxy(request)
}

/**
 * The facility id to forward to the API.
 *
 * An explicit `X-Facility-Id` on the browser request is only forwarded after it
 * is proven reachable by the signed-in account; otherwise the persisted
 * selection is used. Returning `null` leaves the header off so single-facility
 * tenants behave exactly as before.
 */
async function resolveFacilityForRequest(
  request: NextRequest,
  _accessToken: string
): Promise<number | null> {
  const user = await getVerifiedUser()

  if (!user) {
    return null
  }

  const explicit = request.headers.get("x-facility-id")
  const validatedExplicit = resolveFacilityId(explicit, user.facility_ids)

  if (validatedExplicit !== null) {
    return validatedExplicit
  }

  const stored = request.cookies.get(FACILITY_COOKIE_NAME)?.value ?? null

  return resolveFacilityId(stored, user.facility_ids)
}
