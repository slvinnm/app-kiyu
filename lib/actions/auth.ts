"use server"

import { redirect } from "next/navigation"
import { z } from "zod"

import { clearSession, createSession, getSession } from "@/lib/auth/session"

import { toSessionUser } from "@/types/auth"

import type { AuthResponse, AuthUser } from "@/types/auth"

const API_BASE_URL = process.env.API_BASE_URL

if (!API_BASE_URL) {
  throw new Error("API_BASE_URL is not configured.")
}

const AUTH_BASE_URL = API_BASE_URL.replace(/\/$/, "")

export type AuthActionState =
  | {
      id: string
      message: string
    }
  | undefined

const loginSchema = z.object({
  email: z.email("Email tidak valid."),
  password: z.string().min(6, "Password minimal 6 karakter."),
})

const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Nama wajib diisi."),
    email: z.email("Email tidak valid."),
    password: z.string().min(8, "Password minimal 8 karakter."),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Konfirmasi password tidak cocok.",
    path: ["password_confirmation"],
  })

/**
 * Only allow internal redirect targets. Prevents open redirects through the
 * `callbackUrl` query parameter.
 */
function safeCallback(callbackUrl: string | undefined): string {
  if (!callbackUrl) {
    return "/redirect"
  }

  if (
    !callbackUrl.startsWith("/") ||
    callbackUrl.startsWith("//") ||
    callbackUrl.includes("\\")
  ) {
    return "/redirect"
  }

  return callbackUrl
}

function errorState(message: string): AuthActionState {
  return {
    id: crypto.randomUUID(),
    message,
  }
}

type Credentials = {
  token: string
  user: AuthUser
}

export async function authenticate(
  callbackUrl: string | undefined,
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return errorState(
      parsed.error.issues[0]?.message ?? "Email atau password salah."
    )
  }

  let credentials: Credentials | null = null

  try {
    const response = await fetch(`${AUTH_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    })

    const payload = (await response
      .json()
      .catch(() => null)) as AuthResponse | null

    if (!response.ok || !payload?.data?.token || !payload.data.user?.role) {
      return errorState(payload?.message || "Email atau password salah.")
    }

    credentials = payload.data
  } catch {
    return errorState("Tidak dapat terhubung ke server.")
  }

  if (!credentials) {
    return errorState("Terjadi kesalahan saat login.")
  }

  await createSession(credentials.token, toSessionUser(credentials.user))

  redirect(safeCallback(callbackUrl))
}

export async function register(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    password_confirmation: formData.get("password_confirmation"),
  })

  if (!parsed.success) {
    return errorState(
      parsed.error.issues[0]?.message ?? "Data registrasi tidak valid."
    )
  }

  let credentials: Credentials | null = null

  try {
    const response = await fetch(`${AUTH_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    })

    const payload = (await response
      .json()
      .catch(() => null)) as AuthResponse | null

    if (!response.ok) {
      return errorState(payload?.message ?? "Registrasi gagal.")
    }

    if (payload?.data?.token && payload.data.user?.role) {
      credentials = payload.data
    }
  } catch {
    return errorState("Tidak dapat terhubung ke server.")
  }

  if (credentials) {
    await createSession(credentials.token, toSessionUser(credentials.user))
    redirect("/redirect")
  }

  redirect("/login")
}

export async function logout(): Promise<void> {
  const session = await getSession()

  if (session?.token) {
    try {
      await fetch(`${AUTH_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${session.token}`,
        },
        cache: "no-store",
      })
    } catch {
      // Best effort: remote token revocation must not block local logout.
    }
  }

  await clearSession()

  redirect("/login")
}
