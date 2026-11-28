import { cookies } from "next/headers"
import { env, AUTH_COOKIES } from "@/config/environment"
import { ApiException } from "@/lib/api/transport"

export type AuthContextKey = keyof typeof AUTH_COOKIES

export interface AuthSession {
  token: string
  context: string
  user: {
    id: number
    name: string
    email: string
    role: string
    tenant_id: number | null
    tenant: {
      id: number
      name: string
      slug: string
      status: string
      timezone: string
    } | null
    facilities: Array<{ id: number; name: string; code: string }>
    facility_ids: number[]
    station_id: number | null
    profile: {
      id: number
      name: string
      phone: string | null
      email: string | null
      address: string | null
    } | null
  }
}

export interface AuthContextConfig {
  contextKey: AuthContextKey
  apiContext: "app" | "tenant" | "customer" | "portal"
  cookieName: string
  loginPath: string
  meEndpoint: string
  logoutEndpoint: string
}

// Config for each auth context
export const AUTH_CONTEXTS: Record<AuthContextKey, AuthContextConfig> = {
  app: {
    contextKey: "app",
    apiContext: "app",
    cookieName: AUTH_COOKIES.app,
    loginPath: "/app/login",
    meEndpoint: "/auth/me",
    logoutEndpoint: "/auth/logout",
  },
  tenant: {
    contextKey: "tenant",
    apiContext: "tenant",
    cookieName: AUTH_COOKIES.tenant,
    loginPath: "/login",
    meEndpoint: "/auth/me",
    logoutEndpoint: "/auth/logout",
  },
  customer: {
    contextKey: "customer",
    apiContext: "customer",
    cookieName: AUTH_COOKIES.customer,
    loginPath: "/login?mode=customer",
    meEndpoint: "/auth/me",
    logoutEndpoint: "/auth/logout",
  },
  portal: {
    contextKey: "portal",
    apiContext: "portal",
    cookieName: AUTH_COOKIES.portal,
    loginPath: "/portal/login",
    meEndpoint: "/auth/me",
    logoutEndpoint: "/auth/logout",
  },
  kiosk: {
    contextKey: "kiosk",
    apiContext: "tenant", // Device tokens use tenant context but different header
    cookieName: AUTH_COOKIES.kiosk,
    loginPath: "/kiosk",
    meEndpoint: "",
    logoutEndpoint: "",
  },
  display: {
    contextKey: "display",
    apiContext: "tenant",
    cookieName: AUTH_COOKIES.display,
    loginPath: "/display",
    meEndpoint: "",
    logoutEndpoint: "",
  },
}

/**
 * Get the auth cookie value for a context
 */
export async function getAuthCookie(
  contextKey: AuthContextKey
): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(AUTH_COOKIES[contextKey])?.value
}

/**
 * Set auth cookie (HttpOnly, Secure in production, SameSite=Lax)
 */
export async function setAuthCookie(
  contextKey: AuthContextKey,
  token: string,
  maxAgeSeconds = 60 * 60 * 24 * 14
): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(AUTH_COOKIES[contextKey], token, {
    httpOnly: true,
    secure: env.apiBaseUrl.startsWith("https"),
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  })
}

/**
 * Clear auth cookie for a context
 */
export async function clearAuthCookie(
  contextKey: AuthContextKey
): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_COOKIES[contextKey])
}

/**
 * Check if user is authenticated in a specific context
 */
export async function isAuthenticated(
  contextKey: AuthContextKey
): Promise<boolean> {
  return !!(await getAuthCookie(contextKey))
}

/**
 * Clear ALL auth cookies (used for complete logout across contexts)
 */
export async function clearAllAuthCookies(): Promise<void> {
  await Promise.all(
    (Object.keys(AUTH_COOKIES) as AuthContextKey[]).map(clearAuthCookie)
  )
}

/**
 * Handle API authentication errors (401/403)
 */
export async function handleAuthError(
  error: unknown,
  contextKey: AuthContextKey
): Promise<{ shouldRedirect: boolean; redirectPath: string }> {
  if (error instanceof ApiException) {
    if (error.status === 401) {
      await clearAuthCookie(contextKey)
      return {
        shouldRedirect: true,
        redirectPath: AUTH_CONTEXTS[contextKey].loginPath,
      }
    }
    if (error.status === 403) {
      return { shouldRedirect: false, redirectPath: "" }
    }
  }
  return { shouldRedirect: false, redirectPath: "" }
}
