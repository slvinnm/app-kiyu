import "server-only"

import { cookies } from "next/headers"
import { getToken } from "next-auth/jwt"

const AUTH_SECRET = process.env.AUTH_SECRET

if (!AUTH_SECRET) {
  throw new Error("AUTH_SECRET is not configured.")
}

const isSecureCookie = process.env.NODE_ENV === "production"

const sessionCookieName = isSecureCookie
  ? "__Secure-authjs.session-token"
  : "authjs.session-token"

async function decodeLaravelAccessToken(request: Request) {
  try {
    const token = await getToken({
      req: request,
      secret: AUTH_SECRET,
      salt: sessionCookieName,
      cookieName: sessionCookieName,
      secureCookie: isSecureCookie,
    })

    if (typeof token?.accessToken !== "string") {
      return null
    }

    return token.accessToken
  } catch {
    return null
  }
}

export async function getLaravelAccessToken() {
  const cookieStore = await cookies()

  const sessionCookie = cookieStore.get(sessionCookieName)

  if (!sessionCookie) {
    return null
  }

  const request = new Request("http://internal-auth", {
    headers: {
      cookie: `${sessionCookieName}=${sessionCookie.value}`,
    },
  })

  return decodeLaravelAccessToken(request)
}

export async function getLaravelAccessTokenFromRequest(request: Request) {
  return decodeLaravelAccessToken(request)
}
