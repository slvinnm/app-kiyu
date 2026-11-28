import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { http } from "@/lib/api/transport"
import { AUTH_COOKIES, env } from "@/config/environment"
import { resolveHost } from "@/lib/host-routing/resolve-host"
import { mapApiErrorToResponse } from "@/lib/auth/session-handler"

/**
 * POST /api/session/device/display/pair
 * Redeems a display pairing code and stores the credential in an HttpOnly cookie.
 */
export async function POST(request: NextRequest) {
  const match = resolveHost(request.headers.get("host"), "/display")
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
    }>("/devices/display/pair", {
      context: "tenant",
      tenantSlug: match.tenantSlug,
      method: "POST",
      body: JSON.stringify({ pairing_code: payload.pairing_code }),
    })

    const res = NextResponse.json({
      message: "Display paired",
      device: response.data.device,
    })

    res.cookies.set(AUTH_COOKIES.display, response.data.credential, {
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
