import "server-only"

import { serverApiFetch } from "@/lib/api/server"

import type { Department, Paginated, Patient, Visit } from "@/types/reception"
import type {
  AdminStation,
  AdminUser,
  AdminVisitDetail,
  AuditFilters,
  AuditLog,
  DepartmentFilters,
  PatientFilters,
  PublicQueueStation,
  Referral,
  ReferralDetail,
  ReferralFilters,
  StationListFilters,
  UserFilters,
  VisitFilters,
  Workflow,
  WorkflowListFilters,
} from "@/types/admin"

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

/* -------------------------------------------------------------------------- */
/* Select options (unpaginated, dedicated endpoints)                          */
/* -------------------------------------------------------------------------- */

export async function getDepartmentOptionsServer(): Promise<Department[]> {
  const response = await serverApiFetch<{ data: Department[] }>(
    "/departments/options"
  )
  return response.data
}

export async function getStationOptionsServer(
  filters: { department_id?: number; type?: string } = {}
): Promise<AdminStation[]> {
  const response = await serverApiFetch<{ data: AdminStation[] }>(
    `/stations/options${toQuery(filters)}`
  )
  return response.data
}

/* -------------------------------------------------------------------------- */
/* Table data (paginated by the API by default)                               */
/* -------------------------------------------------------------------------- */

export async function getDepartmentsTableServer(
  filters: DepartmentFilters = {}
): Promise<Paginated<Department>> {
  const response = await serverApiFetch<{ data: Paginated<Department> }>(
    `/departments${toQuery(filters)}`
  )
  return response.data
}

export async function getStationsTableServer(
  filters: StationListFilters = {}
): Promise<Paginated<AdminStation>> {
  const response = await serverApiFetch<{ data: Paginated<AdminStation> }>(
    `/stations${toQuery(filters)}`
  )
  return response.data
}

export async function getWorkflowsTableServer(
  filters: WorkflowListFilters = {}
): Promise<Paginated<Workflow>> {
  const response = await serverApiFetch<{ data: Paginated<Workflow> }>(
    `/workflows${toQuery(filters)}`
  )
  return response.data
}

/* -------------------------------------------------------------------------- */
/* Dashboard statistics                                                       */
/* -------------------------------------------------------------------------- */

export type CountStatistics = {
  total: number
}

export async function getWorkflowStatisticsServer(): Promise<CountStatistics> {
  const response = await serverApiFetch<{ data: CountStatistics }>(
    "/workflows/statistics"
  )
  return response.data
}

export async function getPatientStatisticsServer(): Promise<CountStatistics> {
  const response = await serverApiFetch<{ data: CountStatistics }>(
    "/patients/statistics"
  )
  return response.data
}

export async function getVisitStatisticsServer(filters: {
  date?: string
  status?: string
  department_id?: number
} = {}): Promise<CountStatistics> {
  const response = await serverApiFetch<{ data: CountStatistics }>(
    `/visits/statistics${toQuery(filters)}`
  )
  return response.data
}

export async function getTicketStatisticsServer(filters: {
  status?: string
  station_id?: number
  date?: string
} = {}): Promise<CountStatistics> {
  const response = await serverApiFetch<{ data: CountStatistics }>(
    `/tickets/statistics${toQuery(filters)}`
  )
  return response.data
}

export async function getWorkflowServer(id: number): Promise<Workflow> {
  const response = await serverApiFetch<{ data: Workflow }>(`/workflows/${id}`)
  return response.data
}

export async function getPatientsServer(
  filters: PatientFilters = {}
): Promise<Paginated<Patient>> {
  const response = await serverApiFetch<{ data: Paginated<Patient> }>(
    `/patients${toQuery(filters)}`
  )
  return response.data
}

export async function getVisitsServer(
  filters: VisitFilters = {}
): Promise<Paginated<Visit>> {
  const response = await serverApiFetch<{ data: Paginated<Visit> }>(
    `/visits${toQuery(filters)}`
  )
  return response.data
}

export async function getVisitDetailServer(
  id: number
): Promise<AdminVisitDetail> {
  const response = await serverApiFetch<{ data: AdminVisitDetail }>(
    `/visits/${id}`
  )
  return response.data
}

export async function getAuditLogsServer(
  filters: AuditFilters = {}
): Promise<Paginated<AuditLog>> {
  const response = await serverApiFetch<{ data: Paginated<AuditLog> }>(
    `/audit-logs${toQuery(filters)}`
  )
  return response.data
}

export async function getPublicQueueServer(
  filters: { station_id?: number; department_id?: number } = {}
): Promise<PublicQueueStation[]> {
  const response = await serverApiFetch<{ data: PublicQueueStation[] }>(
    `/public/queue${toQuery(filters)}`
  )
  return response.data
}

export async function getUsersServer(
  filters: UserFilters = {}
): Promise<Paginated<AdminUser>> {
  const response = await serverApiFetch<{ data: Paginated<AdminUser> }>(
    `/users${toQuery(filters)}`
  )
  return response.data
}

export async function getReferralsServer(
  filters: ReferralFilters = {}
): Promise<Paginated<Referral>> {
  const response = await serverApiFetch<{ data: Paginated<Referral> }>(
    `/referrals${toQuery(filters)}`
  )
  return response.data
}

export async function getReferralServer(id: number): Promise<ReferralDetail> {
  const response = await serverApiFetch<{ data: ReferralDetail }>(
    `/referrals/${id}`
  )
  return response.data
}
