import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { http, ApiException, type ApiContext } from "@/lib/api/transport"
import { AUTH_COOKIES } from "@/config/environment"
import { resolveHost } from "@/lib/host-routing/resolve-host"

/**
 * BFF Proxy Route: /api/proxy/[context]/[...path]
 * Forwards API requests to the backend with correct context, token, and origin
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ context: string; path: string[] }> }
) {
  return handleProxy(request, params, "GET")
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ context: string; path: string[] }> }
) {
  return handleProxy(request, params, "POST")
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ context: string; path: string[] }> }
) {
  return handleProxy(request, params, "PUT")
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ context: string; path: string[] }> }
) {
  return handleProxy(request, params, "PATCH")
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ context: string; path: string[] }> }
) {
  return handleProxy(request, params, "DELETE")
}

async function handleProxy(
  request: NextRequest,
  paramsPromise: Promise<{ context: string; path: string[] }>,
  method: string
) {
  const { context, path } = await paramsPromise

  // Validate context
  const validContexts: ApiContext[] = ["app", "tenant", "customer", "portal"]
  if (!validContexts.includes(context as ApiContext)) {
    return NextResponse.json(
      { message: "Invalid API context" },
      { status: 400 }
    )
  }

  const apiContext = context as ApiContext

  // Resolve host context for tenant slug and origin
  const match = resolveHost(request.headers.get("host"), "/")
  if (!match && apiContext !== "public") {
    return NextResponse.json(
      { message: "Invalid host context" },
      { status: 403 }
    )
  }

  // Get auth token from cookie (only for authenticated contexts)
  let token: string | undefined
  if (apiContext !== "public") {
    const cookieStore = await cookies()
    token = cookieStore.get(
      AUTH_COOKIES[apiContext as keyof typeof AUTH_COOKIES]
    )?.value

    if (!token) {
      return NextResponse.json(
        { message: "Unauthenticated", error_type: "UNAUTHENTICATED" },
        { status: 401 }
      )
    }
  }

  // Build endpoint path
  const endpoint = "/" + path.join("/")

  // Handle request body
  let body: string | FormData | undefined
  if (["POST", "PUT", "PATCH"].includes(method)) {
    const contentType = request.headers.get("content-type")
    if (contentType?.includes("multipart/form-data")) {
      body = await request.formData()
    } else {
      body = await request.text()
    }
  }

  // Copy search params
  const searchParams = request.nextUrl.searchParams

  try {
    const response = await http(endpoint, {
      context: apiContext,
      method,
      token,
      tenantSlug: match?.tenantSlug,
      body,
      // Pass search params through
      params: Object.fromEntries(searchParams.entries()),
    })

    return NextResponse.json(response)
  } catch (err: unknown) {
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
      { message: "Proxy error", error_type: "PROXY_ERROR" },
      { status: 502 }
    )
  }
}
