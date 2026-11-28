import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { AUTH_COOKIES } from "@/config/environment"
import { http, ApiException, type ApiContext } from "@/lib/api/transport"
import { resolveHost } from "@/lib/host-routing/resolve-host"
import type { AuthSession } from "@/lib/auth/base-auth"

/**
 * GET /api/session/me
 * Returns the current user for the request's host context, validated against backend.
 */
export async function GET(request: NextRequest) {
  const match = resolveHost(request.headers.get("host"), "/")
  if (!match) {
    return NextResponse.json(
      { message: "Invalid host", error_type: "INVALID_HOST" },
      { status: 403 }
    )
  }

  // Map host context -> auth context key
  let contextKey: "app" | "portal" | "tenant" | "customer" | null = null
  if (match.context === "app") contextKey = "app"
  else if (match.context === "portal") contextKey = "portal"
  else if (match.context === "tenant" || match.context === "devices")
    contextKey = "tenant"
  else if (match.context === "customer") contextKey = "customer"

  if (!contextKey) {
    return NextResponse.json(
      { message: "No session context", error_type: "NO_CONTEXT" },
      { status: 404 }
    )
  }

  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIES[contextKey])?.value

  if (!token) {
    return NextResponse.json(
      { message: "Unauthenticated", error_type: "UNAUTHENTICATED" },
      { status: 401 }
    )
  }

  try {
    const response = await http<{ data: AuthSession["user"] }>("/auth/me", {
      context: contextKey as ApiContext,
      token,
      tenantSlug: match.tenantSlug,
    })

    return NextResponse.json({ user: response.data, context: contextKey })
  } catch (err: unknown) {
    if (err instanceof ApiException) {
      if (err.status === 401) {
        const res = NextResponse.json(
          { message: "Session expired", error_type: "UNAUTHENTICATED" },
          { status: 401 }
        )
        res.cookies.delete(AUTH_COOKIES[contextKey])
        return res
      }
      return NextResponse.json(
        { message: err.message, error_type: err.errorType },
        { status: err.status }
      )
    }
    return NextResponse.json(
      { message: "Server error", error_type: "SERVER_ERROR" },
      { status: 500 }
    )
  }
}
