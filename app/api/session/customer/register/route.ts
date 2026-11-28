import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { http } from "@/lib/api/transport"
import {
  extractContextFromHost,
  attachSessionCookie,
  mapApiErrorToResponse,
} from "@/lib/auth/session-handler"
import { CustomerRegisterPayload, LoginResponse } from "@/types/api/auth"

export async function POST(request: NextRequest) {
  const hostCheck = extractContextFromHost(request, "tenant-host")
  if (!hostCheck.ok) return hostCheck.response
  const tenantSlug = hostCheck.tenantSlug as string

  try {
    const payload = (await request.json()) as CustomerRegisterPayload

    const response = await http<LoginResponse>("/auth/register", {
      context: "customer",
      tenantSlug,
      method: "POST",
      body: JSON.stringify(payload),
    })

    const res = NextResponse.json(
      { message: "Registration successful", user: response.data.user },
      { status: 201 }
    )
    attachSessionCookie(res, "customer", response.data.token)
    return res
  } catch (err: unknown) {
    return mapApiErrorToResponse(err)
  }
}
