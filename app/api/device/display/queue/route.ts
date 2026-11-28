import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { http, ApiException } from "@/lib/api/transport"
import { resolveHost } from "@/lib/host-routing/resolve-host"

/**
 * GET /api/device/display/queue
 * Proxies the public queue display through the display credential when present.
 */
export async function GET(request: NextRequest) {
  const match = resolveHost(request.headers.get("host"), "/display")
  if (!match?.tenantSlug) {
    return NextResponse.json(
      { message: "Invalid display host" },
      { status: 403 }
    )
  }

  const cookieStore = await cookies()
  const credential = cookieStore.get("kiyu_display")?.value

  try {
    const data = await http("/public/queue", {
      context: "tenant",
      tenantSlug: match.tenantSlug,
      ...(credential
        ? {
            deviceToken: {
              header: "X-Display-Token" as const,
              value: credential,
            },
          }
        : {}),
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
