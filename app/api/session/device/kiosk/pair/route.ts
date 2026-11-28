import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { http } from "@/lib/api/transport"
import { AUTH_COOKIES, env } from "@/config/environment"
import { resolveHost } from "@/lib/host-routing/resolve-host"
import { mapApiErrorToResponse } from "@/lib/auth/session-handler"

/**
 * POST /api/session/device/kiosk/pair
 * Redeems a kiosk pairing code at the tenant-origin public endpoint and stores
 * the issued device credential in an HttpOnly cookie (never exposed to JS).
 */
export async function POST(request: NextRequest) {
  const match = resolveHost(request.headers.get("host"), "/kiosk")
  if (!match?.tenantSlug) {
    return NextResponse.json(
      { message: "A tenant host is required" },
      { status: 403 }
    )
  }

  try {
    const payload = (await request.json()) as { pairing_code: string }

    const response = await http<{
      data: { device: { id: number; name: string }; credential: string }
    }>("/devices/kiosk/pair", {
      context: "tenant",
      tenantSlug: match.tenantSlug,
      method: "POST",
      body: JSON.stringify({ pairing_code: payload.pairing_code }),
    })

    const res = NextResponse.json({
      message: "Kiosk paired",
      device: response.data.device,
    })

    res.cookies.set(AUTH_COOKIES.kiosk, response.data.credential, {
      httpOnly: true,
      secure: env.apiBaseUrl.startsWith("https"),
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    })

    return res
  } catch (err: unknown) {
    return mapApiErrorToResponse(err)
  }
}
