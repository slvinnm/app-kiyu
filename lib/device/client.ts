/**
 * Browser-side device pairing.
 *
 * The credential itself never reaches JavaScript: `/api/device/pair` stores it
 * in an HttpOnly cookie. This module only redeems the pairing code.
 */

export type DeviceKind = "kiosk" | "display"

export type DeviceInfo = {
  id: number
  name: string
  tenant: { id: number; name: string; slug: string }
  facility: { id: number; name: string; code: string | null }
}

export class DeviceApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "DeviceApiError"
    this.status = status
  }
}

/** Redeems a pairing code; the server stores the credential in a cookie. */
export async function pairDevice(
  kind: DeviceKind,
  pairingCode: string
): Promise<DeviceInfo> {
  const response = await fetch("/api/device/pair", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ kind, pairing_code: pairingCode }),
  })

  const payload = (await response.json().catch(() => null)) as {
    message?: string
    device?: DeviceInfo
  } | null

  if (!response.ok || !payload?.device) {
    throw new DeviceApiError(
      response.status,
      payload?.message ?? "Gagal memasangkan perangkat."
    )
  }

  return payload.device
}
