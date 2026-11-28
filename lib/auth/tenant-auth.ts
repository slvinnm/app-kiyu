"use server"

import { http } from "@/lib/api/transport"
import {
  setAuthCookie,
  clearAuthCookie,
  getAuthCookie,
  type AuthSession,
} from "@/lib/auth/base-auth"
import {
  InvitationAcceptPayload,
  LoginPayload,
  LoginResponse,
} from "@/types/api/auth"

const CONTEXT_KEY = "tenant" as const

/**
 * Log in as tenant workforce (facility_admin | operator | staff)
 * Requires tenant slug for origin resolution
 */
export async function loginTenant(
  payload: LoginPayload,
  tenantSlug: string
): Promise<{ token: string; user: AuthSession["user"] }> {
  const response = await http<LoginResponse>("/auth/login", {
    context: "tenant",
    tenantSlug,
    method: "POST",
    body: JSON.stringify(payload),
  })

  await setAuthCookie(CONTEXT_KEY, response.data.token)

  return { token: response.data.token, user: response.data.user }
}

/**
 * Accept a workforce invitation
 */
export async function acceptInvitation(
  payload: InvitationAcceptPayload,
  tenantSlug: string
): Promise<{ token: string; user: AuthSession["user"] }> {
  const response = await http<LoginResponse>("/auth/invitations/accept", {
    context: "tenant",
    tenantSlug,
    method: "POST",
    body: JSON.stringify(payload),
  })

  await setAuthCookie(CONTEXT_KEY, response.data.token)

  return { token: response.data.token, user: response.data.user }
}

/**
 * Get current tenant user
 */
export async function getTenantUser(
  token?: string,
  tenantSlug?: string
): Promise<AuthSession["user"]> {
  const response = await http<{ data: AuthSession["user"] }>("/auth/me", {
    context: "tenant",
    tenantSlug,
    token,
  })
  return response.data
}

/**
 * Log out tenant session
 */
export async function logoutTenant(
  token?: string,
  tenantSlug?: string
): Promise<void> {
  await http("/auth/logout", {
    context: "tenant",
    tenantSlug,
    method: "POST",
    token,
  })
  await clearAuthCookie(CONTEXT_KEY)
}

/**
 * Check if user has valid tenant session
 */
export async function hasValidTenantSession(
  tenantSlug?: string
): Promise<AuthSession["user"] | null> {
  const token = await getAuthCookie(CONTEXT_KEY)
  if (!token) return null

  try {
    return await getTenantUser(token, tenantSlug)
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
