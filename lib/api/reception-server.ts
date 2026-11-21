import "server-only"

import { serverApiFetch } from "@/lib/api/server"

import type {
  Department,
  Paginated,
  Patient,
  PatientDetail,
  ReceptionQueueSnapshot,
} from "@/types/reception"

export async function getActiveDepartmentsServer(): Promise<Department[]> {
  const response = await serverApiFetch<{ data: Department[] }>(
    "/departments/active"
  )

  return response.data
}

/**
 * All departments (including internal units hidden from the kiosk). Staff
 * workspaces must show every department they can operate.
 */
export async function getAllDepartmentsServer(): Promise<Department[]> {
  const response = await serverApiFetch<{ data: Department[] }>("/departments")

  return response.data
}

export async function getReceptionQueueServer(
  departmentId: number
): Promise<ReceptionQueueSnapshot> {
  const response = await serverApiFetch<{
    message?: string
    data: ReceptionQueueSnapshot
  }>(`/reception/queue?department_id=${departmentId}`)

  return response.data
}

export async function getPatientCountServer(): Promise<number> {
  const response = await serverApiFetch<{ data: Paginated<Patient> }>(
    "/patients?per_page=1"
  )

  return response.data.total
}

export async function getPatientServer(id: number): Promise<PatientDetail> {
  const response = await serverApiFetch<{ data: PatientDetail }>(
    `/patients/${id}`
  )

  return response.data
}

/**
 * Paginated patient directory for the receptionist workspace. The API does the
 * searching and sorting; the browser only ever receives the current page.
 */
export async function getPatientsTableServer(filters: {
  search?: string
  sort?: string
  direction?: "asc" | "desc"
  page?: number
  per_page?: number
}): Promise<Paginated<Patient>> {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value))
    }
  }

  const query = params.toString()

  const response = await serverApiFetch<{ data: Paginated<Patient> }>(
    `/patients${query ? `?${query}` : ""}`
  )

  return response.data
}
