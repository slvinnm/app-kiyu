/**
 * Kiosk device credential storage.
 *
 * A kiosk device is provisioned by an admin, who hands the operator a short
 * pairing code. Redeeming it returns a long-lived credential which is stored in
 * `localStorage` on that device only. The credential is never baked into the
 * build: one deployment serves many tenants and many devices.
 *
 * The credential is a bearer secret in browser storage, so treat this module as
 * the only place that reads or writes it.
 */

export type KioskDeviceInfo = {
  id: number
  name: string
  tenant: { id: number; name: string; slug: string }
  facility: { id: number; name: string; code: string | null }
}

export type KioskPairedDevice = {
  credential: string
  device: KioskDeviceInfo
}

const STORAGE_KEY = "kiyu.kiosk.device"

/** Reads the stored device, or `null` when this browser is not paired. */
export function readKioskDevice(): KioskPairedDevice | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as Partial<KioskPairedDevice>

    if (
      typeof parsed?.credential !== "string" ||
      parsed.credential.length === 0 ||
      typeof parsed?.device?.id !== "number"
    ) {
      return null
    }

    return parsed as KioskPairedDevice
  } catch {
    return null
  }
}

/** Persists a paired device. Called once, right after pairing succeeds. */
export function saveKioskDevice(paired: KioskPairedDevice): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(paired))
}

/** Forgets this device. The credential stays valid server-side until revoked. */
export function clearKioskDevice(): void {
  window.localStorage.removeItem(STORAGE_KEY)
}

/** The stored credential, or `null`. */
export function kioskCredential(): string | null {
  return readKioskDevice()?.credential ?? null
}
