import "server-only"

import { serverApiFetch } from "@/lib/api/server"

import type {
  Department,
  Paginated,
  Client,
  ReceptionQueueSnapshot,
  Station,
} from "@/types/reception"

export async function getActiveDepartmentsServer(): Promise<Department[]> {
  const response = await serverApiFetch<{ data: Department[] }>(
    "/departments/active"
  )

  return response.data
}

/**
 * Service points the signed-in operator may work at. Used to translate the
 * user's station assignment into the department it belongs to.
 */
export async function getStationOptionsServer(): Promise<Station[]> {
  const response = await serverApiFetch<{ data: Station[] }>(
    "/stations/options"
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
    "/customers/statistics"
  )

  return response.data.total
}

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
    `/customers${query ? `?${query}` : ""}`
  )

  return response.data
}

/* Aliases kept while older pages are migrated. */
export const getCustomersTableServer = getClientsTableServer
export const getCustomerCountServer = getClientCountServer
