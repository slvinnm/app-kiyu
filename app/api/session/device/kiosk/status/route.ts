import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { AUTH_COOKIES } from "@/config/environment"
import { resolveHost } from "@/lib/host-routing/resolve-host"

/**
 * GET /api/session/device/kiosk/status
 * Reports whether this browser holds a kiosk credential. The credential itself
 * is never returned.
 */
export async function GET(request: NextRequest) {
  const match = resolveHost(request.headers.get("host"), "/kiosk")
  if (!match?.tenantSlug) {
    return NextResponse.json({ paired: false }, { status: 403 })
  }

  const cookieStore = await cookies()
  const credential = cookieStore.get(AUTH_COOKIES.kiosk)?.value

  return NextResponse.json({
    paired: Boolean(credential),
    tenantSlug: match.tenantSlug,
  })
}
