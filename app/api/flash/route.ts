import { NextResponse } from "next/server"

import { consumeFlash } from "@/lib/flash"

export async function GET() {
  const data = await consumeFlash()

  return NextResponse.json(
    {
      data,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  )
}
