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
  const hostCheck = extractContextFromHost(request, "app")
  if (!hostCheck.ok) return hostCheck.response

  try {
    const payload = (await request.json()) as LoginPayload

    const response = await http<LoginResponse>("/auth/login", {
      context: "app",
      method: "POST",
      body: JSON.stringify(payload),
    })

    const token = response.data.token
    const user = response.data.user

    const res = NextResponse.json({ message: "Login successful", user })
    attachSessionCookie(res, "app", token)
    return res
  } catch (err: unknown) {
    return mapApiErrorToResponse(err)
  }
}
