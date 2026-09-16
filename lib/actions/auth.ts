"use server"

import { AuthError } from "next-auth"

import { signIn, signOut } from "@/auth"

const API_BASE_URL = process.env.API_BASE_URL

if (!API_BASE_URL) {
  throw new Error("API_BASE_URL is not configured.")
}

export async function authenticate(
  _previousState: string | undefined,
  formData: FormData
) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Email atau password salah."

        default:
          return "Terjadi kesalahan saat login."
      }
    }

    throw error
  }
}

export async function register(
  _previousState: string | undefined,
  formData: FormData
) {
  const name = formData.get("name")?.toString().trim()
  const email = formData.get("email")?.toString().trim()
  const password = formData.get("password")?.toString()
  const passwordConfirmation = formData.get("password_confirmation")?.toString()

  if (!name || !email || !password || !passwordConfirmation) {
    return "Semua field wajib diisi."
  }

  if (password !== passwordConfirmation) {
    return "Konfirmasi password tidak cocok."
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
      return payload.message ?? "Registrasi gagal."
    }
  } catch {
    return "Tidak dapat terhubung ke server."
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return "Akun berhasil dibuat, tetapi login otomatis gagal."
    }

    throw error
  }
}

export async function logout() {
  await signOut({
    redirectTo: "/login",
  })
}
