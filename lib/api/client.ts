"use client"

import { ApiError } from "@/lib/api/error"

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`/api/backend${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...options?.headers,
    },
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
        : "Request failed."

    throw new ApiError(message, response.status, data)
  }

  return data as T
}
