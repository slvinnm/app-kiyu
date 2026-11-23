import { NextRequest, NextResponse } from "next/server"

import { writeDeviceCredential } from "@/lib/device/session"

import type { DeviceKind } from "@/lib/device/session"

const API_BASE_URL = process.env.API_BASE_URL ?? ""

if (API_BASE_URL.length === 0) {
  throw new Error("API_BASE_URL is not configured.")
}

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin")

  if (!origin) {
    return true
  }

  let originHost: string

  try {
    originHost = new URL(origin).host
  } catch {
    return false
  }

  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    request.nextUrl.host

  return originHost === host
}

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
    kind?: string
    pairing_code?: string
  } | null

  const kind = body?.kind === "display" ? "display" : "kiosk"
  const pairingCode = (body?.pairing_code ?? "").trim().toUpperCase()

  if (pairingCode.length === 0) {
    return NextResponse.json(
      { message: "Kode pairing wajib diisi." },
      { status: 422 }
    )
  }

  const endpoint = kind === "kiosk" ? "kiosk/pair" : "display/pair"

  const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/${endpoint}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pairing_code: pairingCode }),
    cache: "no-store",
  })

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
