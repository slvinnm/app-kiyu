import { NextRequest, NextResponse } from "next/server"

import {
  deviceCookieName,
  deviceCookieOptions,
  readDeviceCredentialFromRequest,
} from "@/lib/device/session"

import type { DeviceKind } from "@/lib/device/session"

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

  // Behind a reverse proxy `nextUrl.origin` is the internal address, so compare
  // the host the browser actually used.
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    request.nextUrl.host

  return originHost === host
}

/**
 * Proxies a request to the API using the device credential held in the HttpOnly
 * cookie. The browser never sees the credential.
 *
 * `/api/device/kiosk/...` and `/api/device/display/...` select which device
 * credential to use; the rest of the path is forwarded verbatim.
 */
async function proxy(request: NextRequest, kind: DeviceKind) {
  if (isStateChangingMethod(request.method) && !isSameOrigin(request)) {
    return NextResponse.json(
      { success: false, message: "Invalid request origin." },
      { status: 403 }
    )
  }

  const device = readDeviceCredentialFromRequest(request, kind)

  if (!device) {
    return NextResponse.json(
      { success: false, message: "Device is not paired." },
      { status: 401 }
    )
  }

  const prefix = `/api/device/${kind}`
  const path = request.nextUrl.pathname
    .replace(new RegExp(`^${prefix}/?`), "")
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/")

  const targetUrl = `${API_BASE_URL.replace(/\/$/, "")}/${path}${request.nextUrl.search}`

  const headers = new Headers()
  headers.set("Accept", "application/json")

  if (kind === "kiosk") {
    headers.set("X-Kiosk-Token", device.credential)
  } else {
    headers.set("X-Display-Token", device.credential)
  }

  const contentType = request.headers.get("content-type")

  if (contentType) {
    headers.set("Content-Type", contentType)
  }

  const init: RequestInit & { duplex?: "half" } = {
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

  // Rolling session: refresh the cookie on every usable response so an
  // actively used device never expires. A 401/403 means the API rejected the
  // credential (revoked or expired), so drop it and let the page re-onboard.
  if (response.status === 401 || response.status === 403) {
    out.cookies.delete(deviceCookieName(kind))
  } else if (response.ok) {
    out.cookies.set(
      deviceCookieName(kind),
      JSON.stringify(device),
      deviceCookieOptions()
    )
  }

  return out
}

export async function GET(request: NextRequest) {
  return handle(request)
}

export async function POST(request: NextRequest) {
  return handle(request)
}

export async function PUT(request: NextRequest) {
  return handle(request)
}

export async function PATCH(request: NextRequest) {
  return handle(request)
}

export async function DELETE(request: NextRequest) {
  return handle(request)
}

export async function HEAD(request: NextRequest) {
  return handle(request)
}

function handle(request: NextRequest) {
  const kind = deviceKindFromPath(request.nextUrl.pathname)

  if (kind === null) {
    return NextResponse.json(
      { success: false, message: "Unknown device type." },
      { status: 404 }
    )
  }

  return proxy(request, kind)
}

function deviceKindFromPath(pathname: string): DeviceKind | null {
  if (pathname.startsWith("/api/device/kiosk/")) {
    return "kiosk"
  }

  if (pathname.startsWith("/api/device/display/")) {
    return "display"
  }

  return null
}
