import { apiFetch } from "@/lib/api/client"

import type { ApiResponse, Client } from "@/types/reception"
import type { ClientVisitDetail, OnlineBookingResult } from "@/types/client"

function postJson<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
}

/* -------------------------------------------------------------------------- */
/* Online booking                                                            */
/* -------------------------------------------------------------------------- */

export type OnlineBookingPayload = {
  client_id: number
  department_id: number
  idempotency_key?: string
}

export function createOnlineBooking(payload: OnlineBookingPayload) {
  return postJson<ApiResponse<OnlineBookingResult>>("/intake/online", payload)
}

/* -------------------------------------------------------------------------- */
/* Profile                                                                   */
/* -------------------------------------------------------------------------- */

export type ClientProfilePayload = {
  name: string
  phone?: string
  email?: string
  address?: string
}

export type CreateClientProfilePayload = ClientProfilePayload & {
  user_id: number
}

export function createClientProfile(payload: CreateClientProfilePayload) {
  return postJson<ApiResponse<Client>>("/customers", payload)
}

export function updateClientProfile(
  clientId: number,
  payload: ClientProfilePayload
) {
  return apiFetch<ApiResponse<Client>>(`/customers/${clientId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}

/* -------------------------------------------------------------------------- */
/* Visits                                                                    */
/* -------------------------------------------------------------------------- */

export function getVisitDetail(visitId: number, signal?: AbortSignal) {
  return apiFetch<ApiResponse<ClientVisitDetail>>(`/queue-sessions/${visitId}`, {
    signal,
  })
}
