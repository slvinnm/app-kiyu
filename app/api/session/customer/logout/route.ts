import type { NextRequest } from "next/server"
import { handleSessionLogout } from "@/lib/auth/session-handler"

export async function POST(request: NextRequest) {
  return handleSessionLogout(request, "customer", "tenant-host")
}
