import "server-only"

import { createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"

import type { FlashData } from "@/types/flash"

export const FLASH_COOKIE_NAME = "kiyu_flash"

const FLASH_MAX_BYTES = 3000
const AUTH_SECRET = process.env.AUTH_SECRET

if (!AUTH_SECRET) {
  throw new Error("AUTH_SECRET is not configured.")
}

function sign(payload: string): string {
  return createHmac("sha256", AUTH_SECRET).update(payload).digest("base64url")
}

function verify(payload: string, signature: string): boolean {
  const expectedSignature = sign(payload)

  const expectedBuffer = Buffer.from(expectedSignature, "base64url")

  const actualBuffer = Buffer.from(signature, "base64url")

  if (expectedBuffer.length !== actualBuffer.length) {
    return false
  }

  return timingSafeEqual(expectedBuffer, actualBuffer)
}

function encode(data: FlashData): string {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url")

  const signature = sign(payload)

  return `${payload}.${signature}`
}

function decode(value: string): FlashData | null {
  const [payload, signature] = value.split(".")

  if (!payload || !signature) {
    return null
  }

  if (!verify(payload, signature)) {
    return null
  }

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))

    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      return null
    }

    return data as FlashData
  } catch {
    return null
  }
}

export async function flash(key: string, value: unknown): Promise<void> {
  const cookieStore = await cookies()
  const current = cookieStore.get(FLASH_COOKIE_NAME)

  let data: FlashData = {}

  if (current) {
    const existing = decode(current.value)

    if (existing) {
      data = existing
    }
  }

  data[key] = value

  const encoded = encode(data)
  const size = Buffer.byteLength(encoded, "utf8")

  if (size > FLASH_MAX_BYTES) {
    throw new Error(
      `Flash data is too large (${size} bytes). Maximum is ${FLASH_MAX_BYTES} bytes.`
    )
  }

  cookieStore.set(FLASH_COOKIE_NAME, encoded, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60,
  })
}

export async function consumeFlash(): Promise<FlashData> {
  const cookieStore = await cookies()
  const current = cookieStore.get(FLASH_COOKIE_NAME)

  cookieStore.delete(FLASH_COOKIE_NAME)

  if (!current) {
    return {}
  }

  return decode(current.value) ?? {}
}
