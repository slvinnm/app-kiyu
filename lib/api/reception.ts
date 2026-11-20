import { apiFetch } from "@/lib/api/client"

import type {
  ApiResponse,
  CompleteRegistrationPatientData,
  CompleteRegistrationResult,
  Department,
  ManualIntakeResult,
  Paginated,
  PaginatedResponse,
  Patient,
  PatientDetail,
  Priority,
  QueueAcquisition,
  QueueAcquisitionStatus,
  QueueTicket,
  ReceptionQueueSnapshot,
  Visit,
  VisitDetail,
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
/* Organization                                                               */
/* -------------------------------------------------------------------------- */

export function getActiveDepartments(signal?: AbortSignal) {
  return apiFetch<{ data: Department[] }>("/departments/active", { signal })
}

export function getAllDepartments(signal?: AbortSignal) {
  return apiFetch<{ data: Department[] }>("/departments", { signal })
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

export function getVisitDetail(visitId: number, signal?: AbortSignal) {
  return apiFetch<ApiResponse<VisitDetail>>(`/visits/${visitId}`, { signal })
}

export type QueueAcquisitionFilters = {
  channel?: "MANUAL" | "KIOSK" | "ONLINE"
  status?: QueueAcquisitionStatus
  department_id?: number
  date?: string
  page?: number
  per_page?: number
}

export function getQueueAcquisitions(
  filters: QueueAcquisitionFilters = {},
  signal?: AbortSignal
) {
  return apiFetch<ApiResponse<Paginated<QueueAcquisition>>>(
    `/queue-acquisitions${toQuery(filters)}`,
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

export function getPatientVisits(patientId: number, signal?: AbortSignal) {
  return apiFetch<ApiResponse<Visit[]>>(`/patients/${patientId}/visits`, {
    signal,
  })
}
