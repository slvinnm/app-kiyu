import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { AUTH_COOKIES, env } from "@/config/environment"
import { ApiException, http, type ApiContext } from "@/lib/api/transport"
import { resolveHost } from "@/lib/host-routing/resolve-host"
import type { AuthContextKey } from "@/lib/auth/base-auth"

export function extractContextFromHost(
  request: NextRequest,
  expected: "app" | "portal" | "tenant-host"
): { ok: true; tenantSlug?: string } | { ok: false; response: NextResponse } {
  const host = request.headers.get("host")
  const match = resolveHost(host, "/")

  if (!match) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "Invalid host context", error_type: "INVALID_HOST" },
        { status: 403 }
      ),
    }
  }

  if (expected === "app" && match.context !== "app") {
    return {
      ok: false,
      response: NextResponse.json(
        {
          message: "Endpoint only valid on App Console host",
          error_type: "WRONG_CONTEXT",
        },
        { status: 403 }
      ),
    }
  }

  if (expected === "portal" && match.context !== "portal") {
    return {
      ok: false,
      response: NextResponse.json(
        {
          message: "Endpoint only valid on Platform Portal host",
          error_type: "WRONG_CONTEXT",
        },
        { status: 403 }
      ),
    }
  }

  if (expected === "tenant-host" && !match.tenantSlug) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          message: "Endpoint requires a tenant subdomain",
          error_type: "WRONG_CONTEXT",
        },
        { status: 403 }
      ),
    }
  }

  return { ok: true, tenantSlug: match.tenantSlug }
}

export function attachSessionCookie(
  res: NextResponse,
  contextKey: AuthContextKey,
  token: string,
  maxAgeSeconds = 60 * 60 * 24 * 14
) {
  res.cookies.set(AUTH_COOKIES[contextKey], token, {
    httpOnly: true,
    secure: env.apiBaseUrl.startsWith("https"),
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  })
}

export async function handleSessionLogout(
  request: NextRequest,
  contextKey: "app" | "tenant" | "customer" | "portal",
  expectedHost: "app" | "portal" | "tenant-host"
): Promise<NextResponse> {
  const hostCheck = extractContextFromHost(request, expectedHost)
  if (!hostCheck.ok) return hostCheck.response

  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIES[contextKey])?.value

  if (token) {
    try {
      await http("/auth/logout", {
        context: contextKey as ApiContext,
        token,
        tenantSlug: hostCheck.tenantSlug,
        method: "POST",
      })
    } catch {
      // Even if backend revocation fails (e.g. token already expired), clear local cookie
    }
  }

  const res = NextResponse.json({ message: "Logged out successfully" })
  res.cookies.delete(AUTH_COOKIES[contextKey])
  return res
}

export function mapApiErrorToResponse(err: unknown): NextResponse {
  if (err instanceof ApiException) {
    return NextResponse.json(
      {
        message: err.message,
        error_type: err.errorType,
        ...(err.errors ? { errors: err.errors } : {}),
      },
      { status: err.status }
    )
  }
  return NextResponse.json(
    { message: "Internal server error", error_type: "SERVER_ERROR" },
    { status: 500 }
  )
}
