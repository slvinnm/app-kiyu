import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
  },

  callbacks: {
    authorized({ auth, request }) {
      const pathname = request.nextUrl.pathname
      const user = auth?.user

      const isAuthenticated = !!user

      /*
       * Guest-only pages.
       *
       * Authenticated users should not see
       * login/signup pages.
       */
      if (pathname === "/login" || pathname === "/signup") {
        if (isAuthenticated) {
          return Response.redirect(new URL("/dashboard", request.url))
        }

        return true
      }

      /*
       * Route-level authorization is handled
       * by proxy.ts + route-access.ts.
       */
      return true
    },
  },

  providers: [],
} satisfies NextAuthConfig
