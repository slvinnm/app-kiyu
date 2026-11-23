import "server-only"

import { serverApiFetch } from "@/lib/api/server"

import type {
  Department,
  Paginated,
  Client,
  ClientDetail,
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
export async function getDepartmentOptionsServer(): Promise<Department[]> {
  const response = await serverApiFetch<{ data: Department[] }>(
    "/departments/options"
  )

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

export async function getClientCountServer(): Promise<number> {
  const response = await serverApiFetch<{ data: { total: number } }>(
    "/clients/statistics"
  )

  return response.data.total
}

export async function getClientServer(id: number): Promise<ClientDetail> {
  const response = await serverApiFetch<{ data: ClientDetail }>(
    `/clients/${id}`
  )

  return response.data
}

/**
 * Paginated patient directory for the receptionist workspace. The API does the
 * searching and sorting; the browser only ever receives the current page.
 */
export async function getClientsTableServer(filters: {
  search?: string
  sort?: string
  direction?: "asc" | "desc"
  page?: number
  per_page?: number
}): Promise<Paginated<Client>> {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value))
    }
  }

  const query = params.toString()

  const response = await serverApiFetch<{ data: Paginated<Client> }>(
    `/clients${query ? `?${query}` : ""}`
  )

  return response.data
}

/* Aliases kept while older pages are migrated. */
export const getPatientsTableServer = getClientsTableServer
export const getPatientCountServer = getClientCountServer
