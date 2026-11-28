"use server"

import { http } from "@/lib/api/transport"
import {
  setAuthCookie,
  clearAuthCookie,
  getAuthCookie,
  type AuthSession,
} from "@/lib/auth/base-auth"
import {
  CustomerRegisterPayload,
  LoginPayload,
  LoginResponse,
} from "@/types/api/auth"

const CONTEXT_KEY = "customer" as const

/**
 * Register as a new customer (only when tenant allows public registration)
 */
export async function registerCustomer(
  payload: CustomerRegisterPayload,
  tenantSlug: string
): Promise<{ token: string; user: AuthSession["user"] }> {
  const response = await http<LoginResponse>("/auth/register", {
    context: "customer",
    tenantSlug,
    method: "POST",
    body: JSON.stringify(payload),
  })

  await setAuthCookie(CONTEXT_KEY, response.data.token)

  return { token: response.data.token, user: response.data.user }
}

/**
 * Log in as customer
 */
export async function loginCustomer(
  payload: LoginPayload,
  tenantSlug: string
): Promise<{ token: string; user: AuthSession["user"] }> {
  const response = await http<LoginResponse>("/auth/login", {
    context: "customer",
    tenantSlug,
    method: "POST",
    body: JSON.stringify(payload),
  })

  await setAuthCookie(CONTEXT_KEY, response.data.token)

  return { token: response.data.token, user: response.data.user }
}

/**
 * Get current customer user
 */
export async function getCustomerUser(
  token?: string,
  tenantSlug?: string
): Promise<AuthSession["user"]> {
  const response = await http<{ data: AuthSession["user"] }>("/auth/me", {
    context: "customer",
    tenantSlug,
    token,
  })
  return response.data
}

/**
 * Log out customer session
 */
export async function logoutCustomer(
  token?: string,
  tenantSlug?: string
): Promise<void> {
  await http("/auth/logout", {
    context: "customer",
    tenantSlug,
    method: "POST",
    token,
  })
  await clearAuthCookie(CONTEXT_KEY)
}

/**
 * Check if customer has valid session
 */
export async function hasValidCustomerSession(
  tenantSlug?: string
): Promise<AuthSession["user"] | null> {
  const token = await getAuthCookie(CONTEXT_KEY)
  if (!token) return null

  try {
    return await getCustomerUser(token, tenantSlug)
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
