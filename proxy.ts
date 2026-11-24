import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { SESSION_COOKIE_NAME, readSessionFromRequest } from "@/lib/auth/session-core"
import { isGatedPath } from "@/lib/auth/route-access"

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

/**
 * Optimistic gate only.
 *
 * The proxy runs on every navigation and is deployed close to the user, so it
 * must not make a network call or trust the cookie's `role` claim: that claim
 * is a snapshot from login and goes stale on any demotion or reassignment.
 * Authorization is enforced by `requireRole` in each workspace layout, which
 * reads the account from the API. Here we only answer "is there a signed
 * cookie at all" so anonymous users skip a render they cannot use.
 */
export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Signed HttpOnly session cookie; tampered or absent cookies are rejected.
  const session = readSessionFromRequest(request)

  const isAuthPage = pathname === "/login" || pathname === "/signup"

  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/redirect", request.url))
  }

  if (!isGatedPath(pathname)) {
    return NextResponse.next()
  }

  if (!session) {
    return reject(request, pathname, search)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
      // Server actions carry `next-action`; they must run their own guard
      // (the layout `requireRole`) rather than be redirected mid-action.
      missing: [
        {
          type: "header",
          key: "next-action",
        },
      ],
    },
  ],
}
