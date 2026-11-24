import "server-only"

import { serverApiFetch } from "@/lib/api/server"

import type { Paginated, Visit } from "@/types/reception"
import type {
  ClientAuthUser,
  ClientProfile,
  ClientVisitDetail,
} from "@/types/client"

export type CurrentClient = {
  user: ClientAuthUser
  profile: ClientProfile | null
}

/**
 * Resolves the signed-in user and their linked Customer profile. The session
 * cookie intentionally omits customer PII, so the server fetches `/auth/me`.
 */
export async function getCurrentClientServer(): Promise<CurrentClient> {
  const response = await serverApiFetch<{ data: ClientAuthUser }>("/auth/me")

  return {
    user: response.data,
    profile: response.data.profile ?? null,
  }
}

export async function getClientVisitsServer(
  clientId: number,
  perPage = 20
): Promise<Paginated<Visit>> {
  const response = await serverApiFetch<{ data: Paginated<Visit> }>(
    `/queue-sessions?customer_id=${clientId}&per_page=${perPage}`
  )

  return response.data
}

export async function getVisitDetailServer(
  visitId: number
): Promise<ClientVisitDetail> {
  const response = await serverApiFetch<{ data: ClientVisitDetail }>(
    `/queue-sessions/${visitId}`
  )

  return response.data
}

/* Alias kept while older client pages are migrated. */
export const getCurrentCustomerServer = getCurrentClientServer
