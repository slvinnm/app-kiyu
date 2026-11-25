import { NextRequest, NextResponse } from "next/server"

import { isSameOrigin } from "@/lib/auth/origin"
import { writeDeviceCredential } from "@/lib/device/session"

import type { DeviceKind } from "@/lib/device/session"

const API_BASE_URL = process.env.API_BASE_URL ?? ""

if (API_BASE_URL.length === 0) {
  throw new Error("API_BASE_URL is not configured.")
}

const DEVICE_KINDS = new Set<DeviceKind>(["kiosk", "display"])

/**
 * Redeems a pairing code and stores the resulting credential in an HttpOnly
 * cookie. The credential is returned to the browser only as metadata; the raw
 * value never leaves the server.
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { message: "Invalid request origin." },
      { status: 403 }
    )
  }

  const body = (await request.json().catch(() => null)) as {
    kind?: unknown
    pairing_code?: unknown
  } | null

  const kind = body?.kind

  // Only the two known kinds; an unknown value is a client bug, not a hint to
  // silently fall back to kiosk (that would pair the wrong credential).
  if (typeof kind !== "string" || !DEVICE_KINDS.has(kind as DeviceKind)) {
    return NextResponse.json(
      { message: "Jenis perangkat tidak dikenal." },
      { status: 422 }
    )
  }

  const pairingCode =
    typeof body?.pairing_code === "string"
      ? body.pairing_code.trim().toUpperCase()
      : ""

  if (pairingCode.length === 0) {
    return NextResponse.json(
      { message: "Kode pairing wajib diisi." },
      { status: 422 }
    )
  }

  const endpoint = kind === "kiosk" ? "kiosk/pair" : "display/pair"

  const response = await fetch(
    `${API_BASE_URL.replace(/\/$/, "")}/${endpoint}`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pairing_code: pairingCode }),
      cache: "no-store",
    }
  )

  const payload = (await response.json().catch(() => null)) as {
    message?: string
    data?: {
      credential?: string
      device?: {
        id: number
        name: string
        tenant: { id: number; name: string; slug: string }
        facility: { id: number; name: string; code: string | null }
      }
    }
  } | null

  if (!response.ok || !payload?.data?.credential || !payload.data.device) {
    return NextResponse.json(
      { message: payload?.message ?? "Gagal memasangkan perangkat." },
      { status: response.status || 400 }
    )
  }

  const device = payload.data.device

  await writeDeviceCredential(kind as DeviceKind, {
    credential: payload.data.credential,
    device,
  })

  // The credential stays in the cookie; only device metadata goes back.
  return NextResponse.json({
    message: payload.message ?? "Perangkat berhasil dipasangkan.",
    device,
  })
}
