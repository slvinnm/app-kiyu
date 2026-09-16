import type { ApiResponse, Department, QueueAcquisition } from "@/types/kiosk"

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

    if (!payload?.success) {
      throw new Error(payload?.message ?? "Permintaan tidak berhasil diproses.")
    }

    return payload
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
    `${API_BASE_URL}/kiosk/departments`,
    {
      method: "GET",
    }
  )

  return response.data
}

export async function acquireQueue(
  departmentCode: string,
  idempotencyKey: string
): Promise<ApiResponse<QueueAcquisition>> {
  return request<QueueAcquisition>(`${API_BASE_URL}/kiosk/queue-acquisitions`, {
    method: "POST",
    headers: {
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      department_code: departmentCode,
    }),
  })
}
