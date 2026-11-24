import type {
  ApiResponse,
  Department,
  KioskCheckinResult,
  KioskIntakeResult,
  OnlineBookingLookup,
} from "@/types/kiosk"

/**
 * Kiosk API calls.
 *
 * Every request goes through `/api/device/kiosk/...`, a same-origin proxy that
 * attaches the device credential from an HttpOnly cookie. The credential never
 * reaches this module, so an XSS on the kiosk page cannot read it.
 */

const DEVICE_BASE = "/api/device/kiosk"

const DEFAULT_TIMEOUT = 15_000

/**
 * The API answered but rejected the request. Kiosk callers branch on `status`
 * to tell "credential revoked or expired" (403) from ordinary failures.
 */
export class KioskApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "KioskApiError"
    this.status = status
  }
}

async function request<T>(
  path: string,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  const controller = new AbortController()

  const timeout = window.setTimeout(() => {
    controller.abort()
  }, DEFAULT_TIMEOUT)

  try {
    const response = await fetch(`${DEVICE_BASE}/${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...init?.headers,
      },
      signal: controller.signal,
      cache: "no-store",
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      throw new KioskApiError(
        response.status,
        payload?.message ?? "Terjadi kesalahan pada server."
      )
    }

    if (
      payload === null ||
      typeof payload !== "object" ||
      !("data" in payload)
    ) {
      throw new Error(payload?.message ?? "Respons server tidak valid.")
    }

    return payload as ApiResponse<T>
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Server tidak merespons. Silakan coba lagi.")
    }

    if (error instanceof TypeError) {
      throw new Error(
        "Tidak dapat terhubung ke server. Periksa koneksi jaringan."
      )
    }

    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}

export const SUCCESS_RESET_DELAY = 10

export async function getDepartments(): Promise<Department[]> {
  const response = await request<Department[]>("departments/active", {
    method: "GET",
  })

  return Array.isArray(response.data) ? response.data : []
}

export async function acquireQueue(
  departmentId: number,
  idempotencyKey: string
): Promise<ApiResponse<KioskIntakeResult>> {
  return request<KioskIntakeResult>("intake/kiosk", {
    method: "POST",
    headers: {
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      department_id: departmentId,
      idempotency_key: idempotencyKey,
    }),
  })
}

export async function lookupOnlineBooking(
  identifier: string
): Promise<ApiResponse<OnlineBookingLookup>> {
  return request<OnlineBookingLookup>(
    `intake/online-lookup/${encodeURIComponent(identifier)}`,
    { method: "GET" }
  )
}

export async function checkinOnlineBooking(
  identifier: string
): Promise<ApiResponse<KioskCheckinResult>> {
  return request<KioskCheckinResult>("intake/online-checkin", {
    method: "POST",
    body: JSON.stringify({
      booking_identifier: identifier,
    }),
  })
}
