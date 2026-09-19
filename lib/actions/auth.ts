"use server"

import { AuthError } from "next-auth"
import { signIn, signOut } from "@/auth"
import { flash } from "@/lib/flash"

const API_BASE_URL = process.env.API_BASE_URL

if (!API_BASE_URL) {
  throw new Error("API_BASE_URL is not configured.")
}

export type AuthActionState =
  | {
      id: string
      message: string
    }
  | undefined

export async function authenticate(
  callbackUrl: string | undefined,
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  try {
    await flash("success-login", "Berhasil login")

    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: callbackUrl || "/redirect",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            id: crypto.randomUUID(),
            message: "Email atau password salah.",
          }

        default:
          return {
            id: crypto.randomUUID(),
            message: "Terjadi kesalahan saat login.",
          }
      }
    }

    throw error
  }
}

export async function register(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const name = formData.get("name")?.toString().trim()
  const email = formData.get("email")?.toString().trim()
  const password = formData.get("password")?.toString()
  const passwordConfirmation = formData.get("password_confirmation")?.toString()

  if (!name || !email || !password || !passwordConfirmation) {
    return {
      id: crypto.randomUUID(),
      message: "Semua field wajib diisi.",
    }
  }

  if (password !== passwordConfirmation) {
    return {
      id: crypto.randomUUID(),
      message: "Konfirmasi password tidak cocok.",
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      }),
      cache: "no-store",
    })

    const payload = await response.json()

    if (!response.ok || !payload.success) {
      return {
        id: crypto.randomUUID(),
        message: payload.message ?? "Registrasi gagal.",
      }
    }
  } catch {
    return {
      id: crypto.randomUUID(),
      message: "Tidak dapat terhubung ke server.",
    }
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/redirect",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        id: crypto.randomUUID(),
        message: "Akun berhasil dibuat, tetapi login otomatis gagal.",
      }
    }

    throw error
  }
}

export async function logout() {
  await flash("success-logout", "Berhasil logout")

  await signOut({
    redirectTo: "/login",
  })
}
