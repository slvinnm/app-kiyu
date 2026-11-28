"use server"

import { http } from "@/lib/api/transport"
import {
  setAuthCookie,
  clearAuthCookie,
  getAuthCookie,
  type AuthSession,
} from "@/lib/auth/base-auth"
import { LoginPayload, LoginResponse } from "@/types/api/auth"

const CONTEXT_KEY = "portal" as const

/**
 * Log in as platform_admin
 * Platform accounts have tenant_id = null
 * No signup endpoint exists
 */
export async function loginPortal(
  payload: LoginPayload
): Promise<{ token: string; user: AuthSession["user"] }> {
  const response = await http<LoginResponse>("/auth/login", {
    context: "portal",
    method: "POST",
    body: JSON.stringify(payload),
  })

  await setAuthCookie(CONTEXT_KEY, response.data.token)

  return { token: response.data.token, user: response.data.user }
}

/**
 * Get current platform admin user
 */
export async function getPortalUser(
  token?: string
): Promise<AuthSession["user"]> {
  const response = await http<{ data: AuthSession["user"] }>("/auth/me", {
    context: "portal",
    token,
  })
  return response.data
}

/**
 * Log out portal session
 */
export async function logoutPortal(token?: string): Promise<void> {
  await http("/auth/logout", {
    context: "portal",
    method: "POST",
    token,
  })
  await clearAuthCookie(CONTEXT_KEY)
}

/**
 * Check if user has valid portal session
 */
export async function hasValidPortalSession(): Promise<
  AuthSession["user"] | null
> {
  const token = await getAuthCookie(CONTEXT_KEY)
  if (!token) return null

  try {
    return await getPortalUser(token)
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
