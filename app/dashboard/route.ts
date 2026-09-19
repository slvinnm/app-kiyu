import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { getRoleRedirect } from "@/lib/auth/redirect"

export async function GET(request: Request) {
  const session = await auth()

  if (!session?.user?.role) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.redirect(
    new URL(getRoleRedirect(session.user.role), request.url)
  )
}
