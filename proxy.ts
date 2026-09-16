import NextAuth from "next-auth"

import { authConfig } from "@/auth.config"
import { getRouteRule, isRoleAllowed } from "@/lib/auth/route-access"

const { auth } = NextAuth(authConfig)

export default auth((request) => {
  const pathname = request.nextUrl.pathname
  const user = request.auth?.user

  const rule = getRouteRule(pathname)

  if (!rule) {
    return
  }

  if (!user) {
    const loginUrl = new URL("/login", request.url)

    loginUrl.searchParams.set("callbackUrl", pathname)

    return Response.redirect(loginUrl)
  }

  if (!isRoleAllowed(user.role, rule.roles)) {
    return Response.redirect(new URL("/unauthorized", request.url))
  }

  return
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
