import { displayHeaders } from "@/lib/public-headers"

import type { PublicQueueStation } from "@/types/admin"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

if (!API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured.")
}

const DEFAULT_TIMEOUT = 10_000

/**
 * The API answered but rejected the request. Display callers branch on `status`
 * to tell "credential revoked" (403) from ordinary failures.
 */
export class DisplayApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "DisplayApiError"
    this.status = status
  }
}

export type DisplayPairingResult = {
  credential: string
  device: {
    id: number
    name: string
    tenant: { id: number; name: string; slug: string }
    facility: { id: number; name: string; code: string | null }
  }
}

/**
 * Public queue feed for display/signage screens. Uses the public API base URL
 * directly (no session) because displays run unauthenticated.
 *
 * Sends `X-Display-Token` when this screen is paired; the API then resolves the
 * tenant and facility from the device.
 */
export async function fetchPublicQueue(
  signal?: AbortSignal
): Promise<PublicQueueStation[]> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT)

  try {
    const response = await fetch(`${API_BASE_URL}/public/queue`, {
      headers: displayHeaders(),
      signal: signal ?? controller.signal,
      cache: "no-store",
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      throw new DisplayApiError(
        response.status,
        (payload as { message?: string } | null)?.message ??
          "Gagal memuat antrian publik."
      )
    }

    if (!payload || typeof payload !== "object") {
      throw new DisplayApiError(
        response.status,
        "Respons server tidak valid."
      )
    }

    return (payload as { data: PublicQueueStation[] }).data
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Server tidak merespons.")
    }

    if (error instanceof TypeError) {
      throw new Error("Tidak dapat terhubung ke server.")
    }

    throw error
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Redeem a pairing code for a display credential. Called from the onboarding
 * screen; the credential is stored locally and never sent anywhere else.
 */
export async function pairDisplayDevice(
  pairingCode: string
): Promise<DisplayPairingResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT)

  try {
    const response = await fetch(`${API_BASE_URL}/display/pair`, {
      method: "POST",
      headers: displayHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ pairing_code: pairingCode }),
      signal: controller.signal,
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      throw new DisplayApiError(
        response.status,
        (payload as { message?: string } | null)?.message ??
          "Gagal memasangkan layar display."
      )
    }

    if (!payload || typeof payload !== "object" || !("data" in payload)) {
      throw new DisplayApiError(
        response.status,
        "Respons server tidak valid."
      )
    }

    return (payload as { data: DisplayPairingResult }).data
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Server tidak merespons. Silakan coba lagi.")
    }

    if (error instanceof TypeError) {
      throw new Error("Tidak dapat terhubung ke server.")
    }

    throw error
  } finally {
    clearTimeout(timeout)
  }
}
