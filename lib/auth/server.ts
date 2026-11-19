import "server-only"

import { getSession, readSessionFromRequest } from "@/lib/auth/session"

/**
 * Returns the Laravel Sanctum bearer token for the current server request.
 */
export async function getLaravelAccessToken(): Promise<string | null> {
  const session = await getSession()

  return session?.token ?? null
}

/**
 * Reads the Laravel Sanctum bearer token from an incoming request. Used by the
 * `/api/backend` proxy route handler.
 */
export async function getLaravelAccessTokenFromRequest(
  request: Request
): Promise<string | null> {
  return readSessionFromRequest(request)?.token ?? null
}
