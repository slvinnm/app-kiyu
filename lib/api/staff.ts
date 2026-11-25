import { apiFetch } from "@/lib/api/client"
import { toQuery } from "@/lib/api/query"

import type {
  ApiResponse,
  QueueTicket,
  Station,
  Visit,
} from "@/types/reception"

/* -------------------------------------------------------------------------- */
/* Station queue                                                              */
/* -------------------------------------------------------------------------- */

export type StationQueueResponse = {
  station: Station
  data: {
    data: QueueTicket[]
  }
}

export function getStationQueue(
  stationId: number,
  signal?: AbortSignal
): Promise<StationQueueResponse> {
  return apiFetch(`/stations/${stationId}/queue`, { signal })
}

export function getStationOptions(
  filters: { department_id?: number; type?: string } = {},
  signal?: AbortSignal
) {
  return apiFetch<{ data: Station[] }>(`/stations/options${toQuery(filters)}`, {
    signal,
  })
}

/* -------------------------------------------------------------------------- */
/* Queue actions                                                              */
/* -------------------------------------------------------------------------- */

export function callNextClinical(stationId: number, assignedTo?: string) {
  return apiFetch<ApiResponse<QueueTicket | null>>("/queue/call-next", {
    method: "POST",
    body: JSON.stringify({ station_id: stationId, assigned_to: assignedTo }),
  })
}

export function startTicket(ticketId: number, userId?: string) {
  return apiFetch<ApiResponse<QueueTicket>>(`/tickets/${ticketId}/start`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  })
}

export function completeTicket(
  ticketId: number,
  payload: { notes?: string; user_id?: string } = {}
) {
  return apiFetch<ApiResponse<CompleteTicketResult>>(
    `/tickets/${ticketId}/complete`,
    { method: "POST", body: JSON.stringify(payload) }
  )
}

export function holdTicket(
  ticketId: number,
  payload: { notes?: string; user_id?: string } = {}
) {
  return apiFetch<ApiResponse<QueueTicket>>(`/tickets/${ticketId}/hold`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function resumeTicket(ticketId: number, userId?: string) {
  return apiFetch<ApiResponse<QueueTicket>>(`/tickets/${ticketId}/resume`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  })
}

export function recallTicket(ticketId: number, userId?: string) {
  return apiFetch<ApiResponse<QueueTicket>>(`/tickets/${ticketId}/recall`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  })
}

export function skipTicket(
  ticketId: number,
  payload: { notes?: string; user_id?: string } = {}
) {
  return apiFetch<ApiResponse<QueueTicket>>(`/tickets/${ticketId}/skip`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function noShowTicket(
  ticketId: number,
  payload: { notes?: string; user_id?: string } = {}
) {
  return apiFetch<ApiResponse<QueueTicket>>(`/tickets/${ticketId}/no-show`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function cancelTicket(
  ticketId: number,
  payload: { notes?: string; user_id?: string } = {}
) {
  return apiFetch<ApiResponse<QueueTicket>>(`/tickets/${ticketId}/cancel`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function transferTicket(
  ticketId: number,
  payload: { target_station_id: number; notes?: string; user_id?: string }
) {
  return apiFetch<ApiResponse<QueueTicket>>(`/tickets/${ticketId}/transfer`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export type CompleteTicketResult = {
  ticket: QueueTicket
  next_ticket: QueueTicket | null
  visit: Visit
}

/* -------------------------------------------------------------------------- */
/* Visit actions                                                              */
/* -------------------------------------------------------------------------- */

export function updateVisitPriority(visitId: number, priority: 1 | 2 | 3) {
  return apiFetch<ApiResponse<Visit>>(`/queue-sessions/${visitId}/priority`, {
    method: "PATCH",
    body: JSON.stringify({ priority }),
  })
}

export function cancelVisit(visitId: number, reason?: string) {
  return apiFetch<ApiResponse<Visit>>(`/queue-sessions/${visitId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  })
}

export const getStations = getStationOptions
