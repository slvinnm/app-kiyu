import { apiFetch } from "@/lib/api/client"
import { toQuery } from "@/lib/api/query"

import type {
  ApiResponse,
  Client,
  Paginated,
  QueueAcquisition,
  QueueTicket,
  ReceptionQueueSnapshot,
} from "@/types/reception"

/* -------------------------------------------------------------------------- */
/* Reception queue                                                            */
/* -------------------------------------------------------------------------- */

export function getReceptionQueue(
  departmentId: number,
  signal?: AbortSignal
): Promise<ApiResponse<ReceptionQueueSnapshot>> {
  return apiFetch(
    `/reception/queue${toQuery({ department_id: departmentId })}`,
    {
      signal,
    }
  )
}

export function callNextReception(departmentId: number, assignedTo?: string) {
  return apiFetch<ApiResponse<QueueTicket | null>>("/reception/call-next", {
    method: "POST",
    body: JSON.stringify({
      department_id: departmentId,
      assigned_to: assignedTo,
    }),
  })
}

export function recallReceptionTicket(ticketId: number, assignedTo?: string) {
  return apiFetch<ApiResponse<QueueTicket>>(`/reception/${ticketId}/recall`, {
    method: "POST",
    body: JSON.stringify({ assigned_to: assignedTo }),
  })
}

export function skipReceptionTicket(
  ticketId: number,
  payload: { reason?: string; user_id?: string } = {}
) {
  return apiFetch<ApiResponse<QueueTicket>>(`/reception/${ticketId}/skip`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function noShowReceptionTicket(ticketId: number, assignedTo?: string) {
  return apiFetch<ApiResponse<QueueTicket>>(`/reception/${ticketId}/no-show`, {
    method: "POST",
    body: JSON.stringify({ user_id: assignedTo }),
  })
}

export type CompleteRegistrationPayload = {
  acquisition_id: number
  client_id?: number
  registered_by?: string
  client_data?: {
    name: string
    nik?: string
    mrn?: string
    date_of_birth?: string
    gender?: string
    phone?: string
    email?: string
    address?: string
  }
  priority?: 1 | 2 | 3
}

export function completeRegistration(input: CompleteRegistrationPayload) {
  return apiFetch<ApiResponse<CompleteRegistrationResult>>(
    "/reception/complete-registration",
    { method: "POST", body: JSON.stringify(input) }
  )
}

export type {
  CompleteRegistrationResult,
  ManualIntakeResult,
} from "@/types/reception"

import type {
  CompleteRegistrationResult,
  ManualIntakeResult,
} from "@/types/reception"

/* -------------------------------------------------------------------------- */
/* Manual intake                                                              */
/* -------------------------------------------------------------------------- */

export function createManualIntake(input: {
  department_id: number
  priority?: 1 | 2 | 3
  idempotency_key?: string
  registered_by?: string
}) {
  return apiFetch<ApiResponse<ManualIntakeResult>>("/intake/manual", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

/* -------------------------------------------------------------------------- */
/* Clients                                                                    */
/* -------------------------------------------------------------------------- */

export type ClientSearchFilters = {
  search?: string
  page?: number
  per_page?: number
}

export function searchClients(
  filters: ClientSearchFilters,
  signal?: AbortSignal
): Promise<ApiResponse<Paginated<Client>>> {
  return apiFetch(`/clients${toQuery(filters)}`, { signal })
}

export function getClient(id: number, signal?: AbortSignal) {
  return apiFetch<ApiResponse<Client>>(`/clients/${id}`, { signal })
}

export type ClientInput = {
  name: string
  nik?: string
  mrn?: string
  date_of_birth?: string
  gender?: string
  phone?: string
  email?: string
  address?: string
}

export function createClient(input: ClientInput) {
  return apiFetch<ApiResponse<Client>>("/clients", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updateClient(id: number, input: Partial<ClientInput>) {
  return apiFetch<ApiResponse<Client>>(`/clients/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
}

/* -------------------------------------------------------------------------- */
/* Visit acquisition                                                          */
/* -------------------------------------------------------------------------- */

export type VisitAcquisition = QueueAcquisition

export function getVisitAcquisition(visitId: number, signal?: AbortSignal) {
  return apiFetch<ApiResponse<QueueAcquisition | null>>(
    `/visits/${visitId}/acquisition`,
    { signal }
  )
}

/* -------------------------------------------------------------------------- */
/* Aliases                                                                    */
/* -------------------------------------------------------------------------- */

export const callNext = callNextReception
export const recallTicket = recallReceptionTicket
export const skipTicket = skipReceptionTicket
export const noShowTicket = noShowReceptionTicket
export const searchPatients = searchClients
export const getPatient = getClient
