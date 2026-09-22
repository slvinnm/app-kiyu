import { apiFetch } from "@/lib/api/client"
import type {
  ApiResponse,
  Department,
  Patient,
  ReceptionVisitPayload,
  Visit,
} from "@/types/reception"

export function getReceptionPatients(search: string, signal?: AbortSignal) {
  return apiFetch<ApiResponse<Patient[]>>(
    `/reception/patients?search=${encodeURIComponent(search)}`,
    {
      signal,
    }
  )
}

export function getReceptionDepartments() {
  return apiFetch<ApiResponse<Department[]>>("/kiosk/departments")
}

export function registerReceptionVisit(payload: ReceptionVisitPayload) {
  return apiFetch<ApiResponse<Visit>>("/reception/visits", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}
