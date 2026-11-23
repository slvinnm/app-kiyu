import "server-only"

import { ApiError } from "@/lib/api/error"
import { getLaravelAccessToken } from "@/lib/auth/server"

const API_BASE_URL = process.env.API_BASE_URL ?? ""

if (!API_BASE_URL) {
  throw new Error("API_BASE_URL is not configured.")
}

/**
 * Server-side fetch straight to the Laravel API with the session's bearer
 * token. Used by server components; never callable from the browser.
 */
export async function serverApiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const token = await getLaravelAccessToken()

  if (!token) {
    throw new ApiError(401, "Unauthenticated.", null)
  }

  const response = await fetch(
    `${API_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`,
    {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    }
  )

  const payload: unknown = await response
    .json()
    .catch(() => ({ message: "Respons tidak valid." }))

  if (!response.ok) {
    throw new ApiError(
      response.status,
      (payload as { message?: string })?.message ?? "Permintaan gagal.",
      payload
    )
  }

  return payload as T
}
