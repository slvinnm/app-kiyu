import { apiFetch } from "@/lib/api/client"

import type { ApiResponse, Patient } from "@/types/reception"
import type { OnlineBookingResult, PatientVisitDetail } from "@/types/patient"

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
  patient_id: number
  department_id: number
  idempotency_key?: string
}

export function createOnlineBooking(payload: OnlineBookingPayload) {
  return postJson<ApiResponse<OnlineBookingResult>>("/intake/online", payload)
}

/* -------------------------------------------------------------------------- */
/* Profile                                                                   */
/* -------------------------------------------------------------------------- */

export type PatientProfilePayload = {
  name: string
  nik?: string
  date_of_birth?: string
  gender?: string
  phone?: string
  email?: string
  address?: string
}

export type CreatePatientProfilePayload = PatientProfilePayload & {
  user_id: number
}

export function createPatientProfile(payload: CreatePatientProfilePayload) {
  return postJson<ApiResponse<Patient>>("/patients", payload)
}

export function updatePatientProfile(
  patientId: number,
  payload: PatientProfilePayload
) {
  return apiFetch<ApiResponse<Patient>>(`/patients/${patientId}`, {
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
  return apiFetch<ApiResponse<PatientVisitDetail>>(`/visits/${visitId}`, {
    signal,
  })
}
