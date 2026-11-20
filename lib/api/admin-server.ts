import "server-only"

import { serverApiFetch } from "@/lib/api/server"

import type {
  Department,
  Paginated,
  Patient,
  QueueTicket,
  Visit,
} from "@/types/reception"
import type {
  AdminStation,
  AdminUser,
  AdminVisitDetail,
  AuditFilters,
  AuditLog,
  PatientFilters,
  PublicQueueStation,
  Referral,
  ReferralDetail,
  ReferralFilters,
  TicketFilters,
  UserFilters,
  VisitFilters,
  Workflow,
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

export async function getDepartmentsServer(): Promise<Department[]> {
  const response = await serverApiFetch<{ data: Department[] }>("/departments")
  return response.data
}

export async function getStationsServer(
  filters: { department_id?: number; type?: string } = {}
): Promise<AdminStation[]> {
  const response = await serverApiFetch<{ data: AdminStation[] }>(
    `/stations${toQuery(filters)}`
  )
  return response.data
}

export async function getWorkflowsServer(
  filters: { department_id?: number } = {}
): Promise<Workflow[]> {
  const response = await serverApiFetch<{ data: Workflow[] }>(
    `/workflows${toQuery(filters)}`
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

export async function getTicketsServer(
  filters: TicketFilters = {}
): Promise<Paginated<QueueTicket>> {
  const response = await serverApiFetch<{ data: Paginated<QueueTicket> }>(
    `/tickets${toQuery(filters)}`
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
