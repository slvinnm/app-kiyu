"use client"

import { ApiError } from "@/lib/api/error"

/**
 * Client-side fetch through the `/api/backend` proxy, which attaches the
 * session's bearer token. Every JSON call from a component goes through here.
 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`/api/backend${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  })

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
