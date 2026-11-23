import { kioskHeaders } from "@/lib/public-headers"

import type {
  ApiResponse,
  Department,
  KioskCheckinResult,
  KioskIntakeResult,
  OnlineBookingLookup,
} from "@/types/kiosk"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

if (!API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured.")
}

const DEFAULT_TIMEOUT = 15_000

/**
 * The API answered but rejected the request. Kiosk callers branch on `status`
 * to tell "credential revoked" (403) from ordinary failures.
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
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  const controller = new AbortController()

  const timeout = window.setTimeout(() => {
    controller.abort()
  }, DEFAULT_TIMEOUT)

  try {
    const response = await fetch(input, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...kioskHeaders(),
        ...init?.headers,
      },
      signal: controller.signal,
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

export type KioskPairingResult = {
  credential: string
  device: {
    id: number
    name: string
    tenant: { id: number; name: string; slug: string }
    facility: { id: number; name: string; code: string | null }
  }
}

/**
 * Redeem a pairing code for a device credential. Called from the onboarding
 * screen; the credential is stored locally and never sent anywhere else.
 */
export async function pairKioskDevice(
  pairingCode: string
): Promise<ApiResponse<KioskPairingResult>> {
  return request<KioskPairingResult>(`${API_BASE_URL}/kiosk/pair`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pairing_code: pairingCode }),
  })
}

export async function getDepartments(): Promise<Department[]> {
  const response = await request<Department[]>(
    `${API_BASE_URL}/departments/active`,
    { method: "GET", headers: kioskHeaders() }
  )

  return Array.isArray(response.data) ? response.data : []
}

export async function acquireQueue(
  departmentId: number,
  idempotencyKey: string
): Promise<ApiResponse<KioskIntakeResult>> {
  return request<KioskIntakeResult>(`${API_BASE_URL}/intake/kiosk`, {
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
    `${API_BASE_URL}/intake/online-lookup/${encodeURIComponent(identifier)}`,
    {
      method: "GET",
    }
  )
}

export async function checkinOnlineBooking(
  identifier: string
): Promise<ApiResponse<KioskCheckinResult>> {
  return request<KioskCheckinResult>(`${API_BASE_URL}/intake/online-checkin`, {
    method: "POST",
    body: JSON.stringify({
      booking_identifier: identifier,
    }),
  })
}
