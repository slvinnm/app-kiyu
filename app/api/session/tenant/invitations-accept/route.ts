import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { http } from "@/lib/api/transport"
import {
  extractContextFromHost,
  attachSessionCookie,
  mapApiErrorToResponse,
} from "@/lib/auth/session-handler"
import { InvitationAcceptPayload, LoginResponse } from "@/types/api/auth"

export async function POST(request: NextRequest) {
  const hostCheck = extractContextFromHost(request, "tenant-host")
  if (!hostCheck.ok) return hostCheck.response
  const tenantSlug = hostCheck.tenantSlug as string

  try {
    const payload = (await request.json()) as InvitationAcceptPayload

    const response = await http<LoginResponse>("/auth/invitations/accept", {
      context: "tenant",
      tenantSlug,
      method: "POST",
      body: JSON.stringify(payload),
    })

    const res = NextResponse.json({
      message: "Invitation accepted successfully",
      user: response.data.user,
    })
    attachSessionCookie(res, "tenant", response.data.token)
    return res
  } catch (err: unknown) {
    return mapApiErrorToResponse(err)
  }
}
