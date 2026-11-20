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
        Accept: "application/json",
        "Content-Type": "application/json",
        ...init?.headers,
      },
      signal: controller.signal,
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      throw new Error(payload?.message ?? "Terjadi kesalahan pada server.")
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
  const response = await request<Department[]>(
    `${API_BASE_URL}/departments/active`,
    {
      method: "GET",
    }
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
