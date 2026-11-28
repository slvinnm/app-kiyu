import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { http } from "@/lib/api/transport"
import {
  extractContextFromHost,
  attachSessionCookie,
  mapApiErrorToResponse,
} from "@/lib/auth/session-handler"
import { LoginPayload, LoginResponse } from "@/types/api/auth"

export async function POST(request: NextRequest) {
  const hostCheck = extractContextFromHost(request, "portal")
  if (!hostCheck.ok) return hostCheck.response

  try {
    const payload = (await request.json()) as LoginPayload

    const response = await http<LoginResponse>("/auth/login", {
      context: "portal",
      method: "POST",
      body: JSON.stringify(payload),
    })

    const res = NextResponse.json({
      message: "Login successful",
      user: response.data.user,
    })
    attachSessionCookie(res, "portal", response.data.token)
    return res
  } catch (err: unknown) {
    return mapApiErrorToResponse(err)
  }
}
