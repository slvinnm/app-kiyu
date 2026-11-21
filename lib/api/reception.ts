import { apiFetch } from "@/lib/api/client"

import type {
  ApiResponse,
  CompleteRegistrationPatientData,
  CompleteRegistrationResult,
  ManualIntakeResult,
  PaginatedResponse,
  Patient,
  PatientDetail,
  Priority,
  QueueAcquisition,
  QueueTicket,
  ReceptionQueueSnapshot,
} from "@/types/reception"

type QueryValue = string | number | boolean | null | undefined

function toQuery(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue
    }

    search.set(key, String(value))
  }

  const query = search.toString()

  return query ? `?${query}` : ""
}

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
/* Manual intake                                                              */
/* -------------------------------------------------------------------------- */

export type ManualIntakePayload = {
  department_id: number
  priority?: Priority
  idempotency_key?: string
  registered_by?: string
}

export function createManualIntake(payload: ManualIntakePayload) {
  return postJson<ApiResponse<ManualIntakeResult>>("/intake/manual", payload)
}

/* -------------------------------------------------------------------------- */
/* Reception queue                                                            */
/* -------------------------------------------------------------------------- */

export function getReceptionQueue(departmentId: number, signal?: AbortSignal) {
  return apiFetch<ApiResponse<ReceptionQueueSnapshot>>(
    `/reception/queue${toQuery({ department_id: departmentId })}`,
    { signal }
  )
}

export function callNext(departmentId: number, assignedTo?: string) {
  return postJson<ApiResponse<QueueTicket | null>>("/reception/call-next", {
    department_id: departmentId,
    assigned_to: assignedTo,
  })
}

export function recallTicket(ticketId: number, assignedTo?: string) {
  return postJson<ApiResponse<QueueTicket>>(`/reception/${ticketId}/recall`, {
    assigned_to: assignedTo,
  })
}

export function skipTicket(
  ticketId: number,
  payload?: { reason?: string; user_id?: string }
) {
  return postJson<ApiResponse<QueueTicket>>(
    `/reception/${ticketId}/skip`,
    payload ?? {}
  )
}

export function noShowTicket(ticketId: number, userId?: string) {
  return postJson<ApiResponse<QueueTicket>>(`/reception/${ticketId}/no-show`, {
    user_id: userId,
  })
}

/* -------------------------------------------------------------------------- */
/* Registration completion                                                    */
/* -------------------------------------------------------------------------- */

export type CompleteRegistrationPayload = {
  acquisition_id: number
  patient_id?: number
  patient_data?: CompleteRegistrationPatientData
  priority?: Priority
  registered_by?: string
}

export function completeRegistration(payload: CompleteRegistrationPayload) {
  return postJson<ApiResponse<CompleteRegistrationResult>>(
    "/reception/complete-registration",
    payload
  )
}

/* -------------------------------------------------------------------------- */
/* Visits & acquisitions                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The acquisition awaiting registration for a visit. This is a dedicated
 * visit sub-resource; `/queue-acquisitions` is the management list and is not
 * meant to be used as a lookup.
 */
export function getVisitAcquisition(
  visitId: number,
  signal?: AbortSignal
) {
  return apiFetch<ApiResponse<QueueAcquisition | null>>(
    `/visits/${visitId}/acquisition`,
    { signal }
  )
}

/* -------------------------------------------------------------------------- */
/* Patients                                                                   */
/* -------------------------------------------------------------------------- */

export type PatientSearchParams = {
  search?: string
  page?: number
  per_page?: number
}

export function searchPatients(
  params: PatientSearchParams = {},
  signal?: AbortSignal
) {
  return apiFetch<PaginatedResponse<Patient>>(`/patients${toQuery(params)}`, {
    signal,
  })
}

export function getPatient(patientId: number, signal?: AbortSignal) {
  return apiFetch<ApiResponse<PatientDetail>>(`/patients/${patientId}`, {
    signal,
  })
}
