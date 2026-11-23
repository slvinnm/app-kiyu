import { NextRequest, NextResponse } from "next/server"

import { SESSION_COOKIE_NAME } from "@/lib/auth/session-core"
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

function isStateChangingMethod(method: string) {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method)
}

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin")

  if (!origin) {
    return true
  }

  let originHost: string

  try {
    originHost = new URL(origin).host
  } catch {
    return false
  }

  // Behind a reverse proxy (nginx) `nextUrl.origin` is the internal address,
  // so compare the request host the browser actually used instead.
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    request.nextUrl.host

  return originHost === host
}

async function proxy(request: NextRequest) {
  if (isStateChangingMethod(request.method) && !isSameOrigin(request)) {
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

  const path = request.nextUrl.pathname
    .replace(/^\/api\/backend\/?/, "")
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/")

  const targetUrl = `${API_BASE_URL.replace(/\/$/, "")}/${path}${request.nextUrl.search}`

  const headers = new Headers()

  headers.set("Accept", "application/json")
  headers.set("Authorization", `Bearer ${accessToken}`)

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
