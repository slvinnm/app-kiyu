import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { SESSION_COOKIE_NAME, readSessionFromRequest } from "@/lib/auth/session-core"
import { isSessionTokenValid } from "@/lib/auth/verify"
import { getRouteRule, isRoleAllowed } from "@/lib/auth/route-access"

/**
 * Clears the session cookie and sends the browser to the login page.
 *
 * A 401-style redirect: the cookie is dead, so drop it here rather than letting
 * every gated page discover that on its own.
 */
function reject(request: NextRequest, pathname: string, search: string) {
  const loginUrl = new URL("/login", request.url)
  loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`)

  const response = NextResponse.redirect(loginUrl)
  response.cookies.delete(SESSION_COOKIE_NAME)

  return response
}

export default async function proxy(request: NextRequest) {
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
    return reject(request, pathname, search)
  }

  if (!isRoleAllowed(session.user.role, rule.roles)) {
    return NextResponse.redirect(new URL("/unauthorized", request.url))
  }

  // The cookie is only a claim. Ask the API whether the token still exists —
  // a deleted row in `personal_access_tokens` must end the session at once.
  if (!(await isSessionTokenValid(session))) {
    return reject(request, pathname, search)
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
