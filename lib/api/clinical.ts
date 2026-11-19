import { apiFetch } from "@/lib/api/client"

import type { ApiResponse } from "@/types/reception"
import type {
  CompleteTicketResult,
  QueueTicket,
  Station,
  TransferTicketResult,
} from "@/types/clinical"

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
/* Station queue                                                              */
/* -------------------------------------------------------------------------- */

export function getStationQueue(stationId: number, signal?: AbortSignal) {
  return apiFetch<{ station: Station; data: QueueTicket[] }>(
    `/stations/${stationId}/queue`,
    { signal }
  )
}

export function getStations(
  filters: { department_id?: number; type?: string } = {},
  signal?: AbortSignal
) {
  const search = new URLSearchParams()

  if (filters.department_id !== undefined) {
    search.set("department_id", String(filters.department_id))
  }

  if (filters.type) {
    search.set("type", filters.type)
  }

  const query = search.toString()

  return apiFetch<{ data: Station[] }>(
    `/stations${query ? `?${query}` : ""}`,
    { signal }
  )
}

/* -------------------------------------------------------------------------- */
/* Clinical queue actions                                                     */
/* -------------------------------------------------------------------------- */

export function callNextClinical(stationId: number, assignedTo?: string) {
  return postJson<ApiResponse<QueueTicket | null>>("/clinical/call-next", {
    station_id: stationId,
    assigned_to: assignedTo,
  })
}

export function startTicket(ticketId: number, userId?: string) {
  return postJson<ApiResponse<QueueTicket>>(`/tickets/${ticketId}/start`, {
    user_id: userId,
  })
}

export function holdTicket(
  ticketId: number,
  payload?: { notes?: string; user_id?: string }
) {
  return postJson<ApiResponse<QueueTicket>>(
    `/tickets/${ticketId}/hold`,
    payload ?? {}
  )
}

export function resumeTicket(ticketId: number, userId?: string) {
  return postJson<ApiResponse<QueueTicket>>(`/tickets/${ticketId}/resume`, {
    user_id: userId,
  })
}

export function completeTicket(
  ticketId: number,
  payload?: { notes?: string; user_id?: string }
) {
  return postJson<ApiResponse<CompleteTicketResult>>(
    `/tickets/${ticketId}/complete`,
    payload ?? {}
  )
}

export function recallTicket(ticketId: number, userId?: string) {
  return postJson<ApiResponse<QueueTicket>>(`/tickets/${ticketId}/recall`, {
    user_id: userId,
  })
}

export function skipTicket(
  ticketId: number,
  payload?: { notes?: string; user_id?: string }
) {
  return postJson<ApiResponse<QueueTicket>>(
    `/tickets/${ticketId}/skip`,
    payload ?? {}
  )
}

export function noShowTicket(
  ticketId: number,
  payload?: { notes?: string; user_id?: string }
) {
  return postJson<ApiResponse<QueueTicket>>(
    `/tickets/${ticketId}/no-show`,
    payload ?? {}
  )
}

export function cancelTicket(
  ticketId: number,
  payload?: { notes?: string; user_id?: string }
) {
  return postJson<ApiResponse<QueueTicket>>(
    `/tickets/${ticketId}/cancel`,
    payload ?? {}
  )
}

export function transferTicket(
  ticketId: number,
  payload: { target_station_id: number; notes?: string; user_id?: string }
) {
  return postJson<ApiResponse<TransferTicketResult>>(
    `/tickets/${ticketId}/transfer`,
    payload
  )
}
