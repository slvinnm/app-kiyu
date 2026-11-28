import { env } from "@/config/environment"
import { ApiError } from "@/types/api/common"

export type ApiContext = "public" | "app" | "tenant" | "customer" | "portal"

export interface RequestOptions extends RequestInit {
  context?: ApiContext
  token?: string
  deviceToken?: { header: "X-Kiosk-Token" | "X-Display-Token"; value: string }
  tenantSlug?: string
  facilityId?: number
  params?: Record<string, string | number | boolean | undefined>
}

export class ApiException extends Error {
  public status: number
  public errorType: string
  public errors?: Record<string, string[]>

  constructor(
    status: number,
    message: string,
    errorType: string = "UNKNOWN_ERROR",
    errors?: Record<string, string[]>
  ) {
    super(message)
    this.name = "ApiException"
    this.status = status
    this.errorType = errorType
    this.errors = errors
  }
}

/**
 * Low-level HTTP transport wrapper with typed error normalization
 */
export async function http<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    context = "public",
    token,
    deviceToken,
    tenantSlug,
    facilityId,
    params,
    headers: customHeaders = {},
    ...customOptions
  } = options

  // Build full URL with context prefix (/public, /app, /tenant, /customer, /portal)
  const base = env.apiBaseUrl.replace(/\/$/, "")
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`
  const contextPrefix = `/${context}`
  const pathWithContext =
    cleanEndpoint.startsWith(`${contextPrefix}/`) ||
    cleanEndpoint === contextPrefix
      ? cleanEndpoint
      : `${contextPrefix}${cleanEndpoint}`

  let url = `${base}${pathWithContext}`

  // Append query params
  const urlObj = new URL(url)
  if (facilityId !== undefined) {
    urlObj.searchParams.set("facility_id", facilityId.toString())
  }
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        urlObj.searchParams.set(key, String(value))
      }
    })
  }
  url = urlObj.toString()

  // Build headers
  const headers = new Headers(customHeaders)
  headers.set("Accept", "application/json")

  // Only set Content-Type for JSON payloads (not FormData or binary)
  if (
    !(customOptions.body instanceof FormData) &&
    customOptions.body !== undefined
  ) {
    headers.set("Content-Type", "application/json")
  }

  // Inject Sanctum Bearer token if provided
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  // Inject Device token if provided (Kiosk / Display)
  if (deviceToken) {
    headers.set(deviceToken.header, deviceToken.value)
  }

  // Origin resolution on server side to match backend context expectations
  if (typeof window === "undefined") {
    let originHost = env.publicHost
    if (context === "app") originHost = env.appHost
    else if (context === "portal") originHost = env.portalHost
    else if (tenantSlug) originHost = `${tenantSlug}.${env.publicHost}`

    const protocol = env.apiBaseUrl.startsWith("https") ? "https" : "http"
    headers.set("Origin", `${protocol}://${originHost}`)
  }

  if (tenantSlug) {
    headers.set("X-Tenant-Slug", tenantSlug)
  }

  try {
    const response = await fetch(url, {
      ...customOptions,
      headers,
      cache: customOptions.cache ?? "no-store",
    })

    if (response.status === 204) {
      return {} as T
    }

    if (!response.ok) {
      let errorData: ApiError = {
        message: response.statusText || "Request failed",
        error_type: "HTTP_ERROR",
      }

      try {
        const json = await response.json()
        errorData = {
          message: json.message || errorData.message,
          error_type: json.error_type || errorData.error_type,
          errors: json.errors,
        }
      } catch {
        // Non-JSON error body
      }

      throw new ApiException(
        response.status,
        errorData.message,
        errorData.error_type,
        errorData.errors
      )
    }

    return (await response.json()) as T
  } catch (error) {
    if (error instanceof ApiException) {
      throw error
    }
    throw new ApiException(
      500,
      error instanceof Error ? error.message : "Network error",
      "NETWORK_ERROR"
    )
  }
}
