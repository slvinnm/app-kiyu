import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { readSessionFromRequest } from "@/lib/auth/session-core"
import { getRouteRule, isRoleAllowed } from "@/lib/auth/route-access"

export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Signed HttpOnly session cookie; tampered or absent cookies are rejected.
  const session = readSessionFromRequest(request)

  const isAuthPage = pathname === "/login" || pathname === "/signup"

  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/redirect", request.url))
  }

  const rule = getRouteRule(pathname)

  if (!rule) {
    return NextResponse.next()
  }

  if (!session) {
    const loginUrl = new URL("/login", request.url)

    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`)

    return NextResponse.redirect(loginUrl)
  }

  if (!isRoleAllowed(session.user.role, rule.roles)) {
    return NextResponse.redirect(new URL("/unauthorized", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
      missing: [
        {
          type: "header",
          key: "next-action",
        },
      ],
    },
  ],
}
