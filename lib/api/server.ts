import "server-only"

import { getLaravelAccessToken } from "@/lib/auth/server"
import { ApiError } from "@/lib/api/error"

const API_BASE_URL = process.env.API_BASE_URL

if (!API_BASE_URL) {
  throw new Error("API_BASE_URL is not configured.")
}

export async function serverApiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const accessToken = await getLaravelAccessToken()

  if (!accessToken) {
    throw new ApiError("Unauthenticated.", 401, [])
  }

  const url = `${API_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`

  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...options?.headers,
    },
    cache: "no-store",
  })

  const contentType = response.headers.get("content-type") ?? ""

  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : `Request failed with status ${response.status}.`

    if (process.env.NODE_ENV === "development") {
      console.error("[serverApiFetch]", {
        path,
        url,
        status: response.status,
        statusText: response.statusText,
        message,
        data,
      })
    }

    throw new ApiError(message, response.status, data)
  }

  return data as T
}
