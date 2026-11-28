import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { http, ApiException } from "@/lib/api/transport"
import { resolveHost } from "@/lib/host-routing/resolve-host"

/**
 * POST /api/device/kiosk/intake
 * Proxies kiosk intake through the device credential.
 */
export async function POST(request: NextRequest) {
  const match = resolveHost(request.headers.get("host"), "/kiosk")
  if (!match?.tenantSlug) {
    return NextResponse.json({ message: "Invalid kiosk host" }, { status: 403 })
  }

  const cookieStore = await cookies()
  const credential = cookieStore.get("kiyu_kiosk")?.value

  if (!credential) {
    return NextResponse.json(
      { message: "No kiosk credential", error_type: "UNAUTHENTICATED" },
      { status: 401 }
    )
  }

  try {
    const payload = await request.json()
    const data = await http("/intake/kiosk", {
      context: "tenant",
      tenantSlug: match.tenantSlug,
      method: "POST",
      deviceToken: { header: "X-Kiosk-Token", value: credential },
      body: JSON.stringify(payload),
    })
    return NextResponse.json(data)
  } catch (err: unknown) {
    if (err instanceof ApiException) {
      return NextResponse.json(
        { message: err.message, error_type: err.errorType },
        { status: err.status }
      )
    }
    return NextResponse.json({ message: "Proxy error" }, { status: 502 })
  }
}
