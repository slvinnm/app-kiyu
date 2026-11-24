"use server"

import { redirect } from "next/navigation"

import { createSession } from "@/lib/auth/session"

import { toSessionUser } from "@/types/auth"

import type { AuthResponse } from "@/types/auth"

const API_BASE_URL = process.env.API_BASE_URL

if (!API_BASE_URL) {
  throw new Error("API_BASE_URL is not configured.")
}

const AUTH_BASE_URL = API_BASE_URL.replace(/\/$/, "")

export type SignupActionState = { id: string; message: string } | undefined

function errorState(message: string): SignupActionState {
  return { id: crypto.randomUUID(), message }
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === "string" ? value.trim() : ""
}

/**
 * SaaS self-service signup (PRD §12.1).
 *
 * Creates the organization (Tenant), its owner, first Facility and a TRIALING
 * subscription in one backend transaction, then signs the owner in to the
 * Platform Portal. The owner may manage the organization immediately; payment
 * follows the 14-day trial.
 */
export async function signupOrganization(
  _previousState: SignupActionState,
  formData: FormData
): Promise<SignupActionState> {
  const organizationName = text(formData, "organization_name")
  const ownerName = text(formData, "owner_name")
  const email = text(formData, "owner_email")
  const password = text(formData, "owner_password")
  const passwordConfirmation = text(formData, "password_confirmation")

  if (!organizationName || !ownerName || !email || !password) {
    return errorState("Semua kolom wajib diisi.")
  }

  if (password.length < 8) {
    return errorState("Password minimal 8 karakter.")
  }

  if (password !== passwordConfirmation) {
    return errorState("Konfirmasi password tidak cocok.")
  }

  let created = false

  try {
    const response = await fetch(`${AUTH_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        organization_name: organizationName,
        owner_name: ownerName,
        owner_email: email,
        owner_password: password,
      }),
      cache: "no-store",
    })

    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null

    if (!response.ok) {
      return errorState(payload?.message ?? "Pendaftaran gagal.")
    }

    created = true
  } catch {
    return errorState("Tidak dapat terhubung ke server.")
  }

  if (!created) {
    return errorState("Terjadi kesalahan saat mendaftar.")
  }

  // Sign the owner in to the Platform Portal now that the organization exists.
  try {
    const login = await fetch(`${AUTH_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, context: "platform_portal" }),
      cache: "no-store",
    })

    const payload = (await login.json().catch(() => null)) as AuthResponse | null

    if (login.ok && payload?.data?.token && payload.data.user?.role) {
      await createSession(
        payload.data.token,
        toSessionUser(payload.data.user),
        "platform_portal"
      )
      redirect("/portal/dashboard")
    }
  } catch {
    // Login failure after a successful signup is recoverable: send them to
    // sign in manually rather than leaving them on an error.
  }

  redirect("/login?registered=1")
}
