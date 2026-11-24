import { apiFetch } from "@/lib/api/client"
import { toQuery } from "@/lib/api/query"

import type {
  ApiResponse,
  Customer,
  CustomerInput,
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

/**
 * Body for `POST /reception/complete-registration`.
 *
 * The backend validates `customer_id` / `customer_data` only. The actor is
 * derived from the authenticated user, never sent by the client
 * (`Controller::actor()`), so there is no `registered_by` field.
 */
export type CompleteRegistrationPayload = {
  acquisition_id: number
  customer_id?: number
  customer_data?: CustomerInput
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

export type CustomerSearchFilters = {
  search?: string
  page?: number
  per_page?: number
}

export function searchCustomers(
  filters: CustomerSearchFilters,
  signal?: AbortSignal
): Promise<ApiResponse<Paginated<Customer>>> {
  return apiFetch(`/customers${toQuery(filters)}`, { signal })
}

export function getCustomer(id: number, signal?: AbortSignal) {
  return apiFetch<ApiResponse<Customer>>(`/customers/${id}`, { signal })
}

export function createCustomer(input: CustomerInput) {
  return apiFetch<ApiResponse<Customer>>("/customers", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updateCustomer(id: number, input: Partial<CustomerInput>) {
  return apiFetch<ApiResponse<Customer>>(`/customers/${id}`, {
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
    `/queue-sessions/${visitId}/acquisition`,
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
export const searchClients = searchCustomers
export const getClient = getCustomer
