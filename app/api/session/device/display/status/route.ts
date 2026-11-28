import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { AUTH_COOKIES } from "@/config/environment"
import { resolveHost } from "@/lib/host-routing/resolve-host"

export async function GET(request: NextRequest) {
  const match = resolveHost(request.headers.get("host"), "/display")
  if (!match?.tenantSlug) {
    return NextResponse.json({ paired: false }, { status: 403 })
  }

  const cookieStore = await cookies()
  const credential = cookieStore.get(AUTH_COOKIES.display)?.value

  return NextResponse.json({
    paired: Boolean(credential),
    tenantSlug: match.tenantSlug,
  })
}
