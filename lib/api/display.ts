import type { PublicQueueStation } from "@/types/admin"

/**
 * Display API calls.
 *
 * Every request goes through `/api/device/display/...`, a same-origin proxy
 * that attaches the display credential from an HttpOnly cookie. The credential
 * never reaches this module, so an XSS on the display page cannot read it.
 */

const DEVICE_BASE = "/api/device/display"

const DEFAULT_TIMEOUT = 10_000

/**
 * The API answered but rejected the request. Display callers branch on `status`
 * to tell "credential revoked or expired" (403) from ordinary failures.
 */
export class DisplayApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "DisplayApiError"
    this.status = status
  }
}

/**
 * Public queue feed for display/signage screens. Uses the device proxy so the
 * API resolves the tenant and facility from the display credential.
 */
export async function fetchPublicQueue(
  signal?: AbortSignal
): Promise<PublicQueueStation[]> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT)

  try {
    const response = await fetch(`${DEVICE_BASE}/public/queue`, {
      headers: { Accept: "application/json" },
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
      throw new DisplayApiError(response.status, "Respons server tidak valid.")
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
