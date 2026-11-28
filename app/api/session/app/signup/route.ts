import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { http } from "@/lib/api/transport"
import {
  extractContextFromHost,
  mapApiErrorToResponse,
} from "@/lib/auth/session-handler"
import { AppSignupPayload, AppSignupResponse } from "@/types/api/auth"

export async function POST(request: NextRequest) {
  const hostCheck = extractContextFromHost(request, "app")
  if (!hostCheck.ok) return hostCheck.response

  try {
    const payload = (await request.json()) as AppSignupPayload

    const response = await http<AppSignupResponse>("/auth/signup", {
      context: "app",
      method: "POST",
      body: JSON.stringify(payload),
    })

    return NextResponse.json(response, { status: 201 })
  } catch (err: unknown) {
    return mapApiErrorToResponse(err)
  }
}
