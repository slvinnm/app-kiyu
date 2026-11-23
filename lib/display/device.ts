/**
 * Display device credential storage.
 *
 * A display screen is provisioned by an admin, who hands the operator a short
 * pairing code. Redeeming it returns a long-lived credential stored in
 * `localStorage` on that screen only. Kept separate from the kiosk credential
 * because one machine may serve either role, and the two have different API
 * surfaces and plan quotas.
 */

export type DisplayDeviceInfo = {
  id: number
  name: string
  tenant: { id: number; name: string; slug: string }
  facility: { id: number; name: string; code: string | null }
}

export type DisplayPairedDevice = {
  credential: string
  device: DisplayDeviceInfo
}

const STORAGE_KEY = "kiyu.display.device"

export function readDisplayDevice(): DisplayPairedDevice | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as DisplayPairedDevice | null

    if (!parsed?.credential || typeof parsed.credential !== "string") {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function saveDisplayDevice(device: DisplayPairedDevice): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(device))
}

export function clearDisplayDevice(): void {
  window.localStorage.removeItem(STORAGE_KEY)
}

/** The raw credential for the `X-Display-Token` header, or `null`. */
export function displayCredential(): string | null {
  return readDisplayDevice()?.credential ?? null
}
