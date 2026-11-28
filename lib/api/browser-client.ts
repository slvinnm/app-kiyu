"use client"

import { ApiException } from "@/lib/api/transport"

export type BrowserApiContext = "app" | "tenant" | "customer" | "portal"

export interface BrowserRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
  params?: Record<string, string | number | boolean | undefined>
  signal?: AbortSignal
}

/**
 * Browser API client that routes through the BFF proxy.
 * The backend bearer token never reaches client JavaScript: the proxy reads the
 * HttpOnly cookie and injects the Authorization header server-side.
 *
 * Usage: `browserApi.get('app', '/facilities')` -> GET /api/proxy/app/facilities
 */
export async function browserApi<T = unknown>(
  context: BrowserApiContext,
  path: string,
  options: BrowserRequestOptions = {}
): Promise<T> {
  const { method = "GET", body, params, signal } = options

  const cleanPath = path.startsWith("/") ? path : `/${path}`
  const url = new URL(
    `/api/proxy/${context}${cleanPath}`,
    window.location.origin
  )

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value))
    }
  }

  const headers = new Headers()
  let payload: BodyInit | undefined

  if (body !== undefined) {
    if (body instanceof FormData) {
      payload = body
    } else {
      headers.set("Content-Type", "application/json")
      payload = JSON.stringify(body)
    }
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: payload,
    credentials: "include",
    signal,
    cache: "no-store",
  })

  if (response.status === 204) {
    return {} as T
  }

  let json: unknown = null
  try {
    json = await response.json()
  } catch {
    json = null
  }

  if (!response.ok) {
    const err = (json ?? {}) as {
      message?: string
      error_type?: string
      errors?: Record<string, string[]>
    }
    throw new ApiException(
      response.status,
      err.message ?? response.statusText ?? "Request failed",
      err.error_type ?? "HTTP_ERROR",
      err.errors
    )
  }

  // Unwrap backend `{ data: ... }` envelope so callers get the payload directly
  if (
    json &&
    typeof json === "object" &&
    "data" in (json as Record<string, unknown>)
  ) {
    return (json as { data: T }).data
  }

  return json as T
}

export const browserApiClient = {
  get: <T = unknown>(
    ctx: BrowserApiContext,
    path: string,
    params?: BrowserRequestOptions["params"],
    signal?: AbortSignal
  ) => browserApi<T>(ctx, path, { params, signal }),
  post: <T = unknown>(ctx: BrowserApiContext, path: string, body?: unknown) =>
    browserApi<T>(ctx, path, { method: "POST", body }),
  put: <T = unknown>(ctx: BrowserApiContext, path: string, body?: unknown) =>
    browserApi<T>(ctx, path, { method: "PUT", body }),
  patch: <T = unknown>(ctx: BrowserApiContext, path: string, body?: unknown) =>
    browserApi<T>(ctx, path, { method: "PATCH", body }),
  delete: <T = unknown>(
    ctx: BrowserApiContext,
    path: string,
    params?: BrowserRequestOptions["params"]
  ) => browserApi<T>(ctx, path, { method: "DELETE", params }),
}
