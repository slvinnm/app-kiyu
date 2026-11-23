import "server-only"

import { serverApiFetch } from "@/lib/api/server"

import type { Paginated, Visit } from "@/types/reception"
import type {
  PatientAuthUser,
  PatientProfile,
  PatientVisitDetail,
} from "@/types/patient"

export type CurrentPatient = {
  user: PatientAuthUser
  profile: PatientProfile | null
}

/**
 * Resolves the signed-in user and their linked Patient profile. The session
 * cookie intentionally omits patient PII, so the server fetches `/auth/me`.
 */
export async function getCurrentPatientServer(): Promise<CurrentPatient> {
  const response = await serverApiFetch<{ data: PatientAuthUser }>("/auth/me")

  return {
    user: response.data,
    profile: response.data.profile ?? null,
  }
}

export async function getPatientVisitsServer(
  patientId: number,
  perPage = 20
): Promise<Paginated<Visit>> {
  const response = await serverApiFetch<{ data: Paginated<Visit> }>(
    `/visits?patient_id=${patientId}&per_page=${perPage}`
  )

  return response.data
}

export async function getVisitDetailServer(
  visitId: number
): Promise<PatientVisitDetail> {
  const response = await serverApiFetch<{ data: PatientVisitDetail }>(
    `/visits/${visitId}`
  )

  return response.data
}
