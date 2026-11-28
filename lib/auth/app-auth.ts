"use server"

import { http } from "@/lib/api/transport"
import {
  setAuthCookie,
  clearAuthCookie,
  getAuthCookie,
  type AuthSession,
} from "@/lib/auth/base-auth"
import {
  AppSignupPayload,
  AppSignupResponse,
  LoginPayload,
  LoginResponse,
} from "@/types/api/auth"

const CONTEXT_KEY = "app" as const

/**
 * Sign up for a new organization (tenant_admin)
 * Returns the created tenant/org info - NO TOKEN returned
 * User must then log in separately
 */
export async function signupApp(
  payload: AppSignupPayload
): Promise<AppSignupResponse> {
  return http<AppSignupResponse>("/auth/signup", {
    context: "app",
    method: "POST",
    body: JSON.stringify(payload),
  })
}

/**
 * Log in as tenant_admin
 * Returns token + user payload
 */
export async function loginApp(
  payload: LoginPayload
): Promise<{ token: string; user: AuthSession["user"] }> {
  const response = await http<LoginResponse>("/auth/login", {
    context: "app",
    method: "POST",
    body: JSON.stringify(payload),
  })

  await setAuthCookie(CONTEXT_KEY, response.data.token)

  return { token: response.data.token, user: response.data.user }
}

/**
 * Get current user (validates token)
 */
export async function getAppUser(token?: string): Promise<AuthSession["user"]> {
  const response = await http<{ data: AuthSession["user"] }>("/auth/me", {
    context: "app",
    token,
  })
  return response.data
}

/**
 * Log out (revokes token on backend)
 */
export async function logoutApp(token?: string): Promise<void> {
  await http("/auth/logout", {
    context: "app",
    method: "POST",
    token,
  })
  await clearAuthCookie(CONTEXT_KEY)
}

/**
 * Check if user has valid app session
 */
export async function hasValidAppSession(): Promise<
  AuthSession["user"] | null
> {
  const token = await getAuthCookie(CONTEXT_KEY)
  if (!token) return null

  try {
    return await getAppUser(token)
  } catch {
    await clearAuthCookie(CONTEXT_KEY)
    return null
  }
}

export {
  getAuthCookie,
  setAuthCookie,
  clearAuthCookie,
} from "@/lib/auth/base-auth"
