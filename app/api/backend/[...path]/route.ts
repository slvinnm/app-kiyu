import { NextRequest, NextResponse } from "next/server"

import { getLaravelAccessTokenFromRequest } from "@/lib/auth/server"

const API_BASE_URL = process.env.API_BASE_URL

if (!API_BASE_URL) {
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

  const expectedOrigin = request.nextUrl.origin

  return origin === expectedOrigin
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

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  })
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
