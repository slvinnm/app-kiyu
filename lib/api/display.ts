import { publicHeaders } from "@/lib/public-headers"

import type { PublicQueueStation } from "@/types/admin"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

if (!API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured.")
}

const DEFAULT_TIMEOUT = 10_000

/**
 * Public queue feed for display/signage screens. Uses the public API base URL
 * directly (no session) because displays run unauthenticated on a TV/kiosk.
 */
export async function fetchPublicQueue(
  signal?: AbortSignal
): Promise<PublicQueueStation[]> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT)

  try {
    const response = await fetch(`${API_BASE_URL}/public/queue`, {
      headers: publicHeaders(),
      signal: signal ?? controller.signal,
      cache: "no-store",
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload || typeof payload !== "object") {
      throw new Error(
        (payload as { message?: string } | null)?.message ??
          "Gagal memuat antrian publik."
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
