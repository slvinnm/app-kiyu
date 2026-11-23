import "server-only"

import { serverApiFetch } from "@/lib/api/server"
import { toQuery } from "@/lib/api/query"

import type { AdminUser } from "@/lib/api/admin"
import type {
  AuditLog,
  Client,
  Department,
  Facility,
  KioskDevice,
  Paginated,
  QueueAcquisition,
  QueueTicket,
  PublicQueueStation,
  Referral,
  Station,
  Subscription,
  Visit,
  Workflow,
} from "@/types/reception"

export type CountStatistics = { total: number }

/* -------------------------------------------------------------------------- */
/* Master data                                                                */
/* -------------------------------------------------------------------------- */

export async function getDepartmentOptionsServer(): Promise<Department[]> {
  const response = await serverApiFetch<{ data: Department[] }>(
    "/departments/options"
  )
  return response.data
}

export async function getStationOptionsServer(
  filters: { department_id?: number } = {}
): Promise<Station[]> {
  const response = await serverApiFetch<{ data: Station[] }>(
    `/stations/options${toQuery(filters)}`
  )
  return response.data
}

export async function getFacilitiesServer(): Promise<Facility[]> {
  const response = await serverApiFetch<{ data: Facility[] }>("/facilities")
  return response.data
}

export async function getKioskDevicesServer(): Promise<KioskDevice[]> {
  const response = await serverApiFetch<{ data: KioskDevice[] }>(
    "/kiosk-devices"
  )
  return response.data
}

/* -------------------------------------------------------------------------- */
/* Paginated tables                                                           */
/* -------------------------------------------------------------------------- */

export type TableFilters = {
  search?: string
  sort?: string
  direction?: "asc" | "desc"
  page?: number
  per_page?: number
  [key: string]: string | number | undefined
}

export async function getDepartmentsServer(
  filters: TableFilters = {}
): Promise<Paginated<Department>> {
  const response = await serverApiFetch<{ data: Paginated<Department> }>(
    `/departments${toQuery(filters)}`
  )
  return response.data
}

export async function getStationsServer(
  filters: TableFilters = {}
): Promise<Paginated<Station>> {
  const response = await serverApiFetch<{ data: Paginated<Station> }>(
    `/stations${toQuery(filters)}`
  )
  return response.data
}

export async function getWorkflowsServer(
  filters: TableFilters = {}
): Promise<Paginated<Workflow>> {
  const response = await serverApiFetch<{ data: Paginated<Workflow> }>(
    `/workflows${toQuery(filters)}`
  )
  return response.data
}

export async function getUsersServer(
  filters: TableFilters = {}
): Promise<Paginated<AdminUser>> {
  const response = await serverApiFetch<{ data: Paginated<AdminUser> }>(
    `/users${toQuery(filters)}`
  )
  return response.data
}

export async function getClientsServer(
  filters: TableFilters = {}
): Promise<Paginated<Client>> {
  const response = await serverApiFetch<{ data: Paginated<Client> }>(
    `/clients${toQuery(filters)}`
  )
  return response.data
}

export async function getVisitsServer(
  filters: TableFilters = {}
): Promise<Paginated<Visit>> {
  const response = await serverApiFetch<{ data: Paginated<Visit> }>(
    `/visits${toQuery(filters)}`
  )
  return response.data
}

export async function getTicketsServer(
  filters: TableFilters = {}
): Promise<Paginated<QueueTicket>> {
  const response = await serverApiFetch<{ data: Paginated<QueueTicket> }>(
    `/tickets${toQuery(filters)}`
  )
  return response.data
}

export async function getQueueAcquisitionsServer(
  filters: TableFilters = {}
): Promise<Paginated<QueueAcquisition>> {
  const response = await serverApiFetch<{ data: Paginated<QueueAcquisition> }>(
    `/queue-acquisitions${toQuery(filters)}`
  )
  return response.data
}

export async function getReferralsServer(
  filters: TableFilters = {}
): Promise<Paginated<Referral>> {
  const response = await serverApiFetch<{ data: Paginated<Referral> }>(
    `/referrals${toQuery(filters)}`
  )
  return response.data
}

export async function getAuditLogsServer(
  filters: TableFilters = {}
): Promise<Paginated<AuditLog>> {
  const response = await serverApiFetch<{ data: Paginated<AuditLog> }>(
    `/audit-logs${toQuery(filters)}`
  )
  return response.data
}

/* -------------------------------------------------------------------------- */
/* Detail views                                                               */
/* -------------------------------------------------------------------------- */

export async function getVisitDetailServer(id: number): Promise<Visit> {
  const response = await serverApiFetch<{ data: Visit }>(`/visits/${id}`)
  return response.data
}

export async function getClientDetailServer(id: number): Promise<Client> {
  const response = await serverApiFetch<{ data: Client }>(`/clients/${id}`)
  return response.data
}

export async function getReferralDetailServer(id: number): Promise<Referral> {
  const response = await serverApiFetch<{ data: Referral }>(`/referrals/${id}`)
  return response.data
}

export async function getWorkflowDetailServer(id: number): Promise<Workflow> {
  const response = await serverApiFetch<{ data: Workflow }>(`/workflows/${id}`)
  return response.data
}

/* -------------------------------------------------------------------------- */
/* Statistics                                                                 */
/* -------------------------------------------------------------------------- */

export async function getVisitStatisticsServer(
  filters: { date?: string; status?: string; department_id?: number } = {}
): Promise<CountStatistics> {
  const response = await serverApiFetch<{ data: CountStatistics }>(
    `/visits/statistics${toQuery(filters)}`
  )
  return response.data
}

export async function getTicketStatisticsServer(
  filters: { date?: string; status?: string; station_id?: number } = {}
): Promise<CountStatistics> {
  const response = await serverApiFetch<{ data: CountStatistics }>(
    `/tickets/statistics${toQuery(filters)}`
  )
  return response.data
}

export async function getClientStatisticsServer(): Promise<CountStatistics> {
  const response = await serverApiFetch<{ data: CountStatistics }>(
    "/clients/statistics"
  )
  return response.data
}

export async function getWorkflowStatisticsServer(): Promise<CountStatistics> {
  const response = await serverApiFetch<{ data: CountStatistics }>(
    "/workflows/statistics"
  )
  return response.data
}

/* -------------------------------------------------------------------------- */
/* Billing                                                                    */
/* -------------------------------------------------------------------------- */

export type SubscriptionView = {
  subscription: Subscription | null
  is_effective: boolean
}

export async function getSubscriptionServer(): Promise<SubscriptionView> {
  const response = await serverApiFetch<{ data: SubscriptionView }>(
    "/billing/subscription"
  )
  return response.data
}

/* -------------------------------------------------------------------------- */
/* Aliases kept for existing pages                                            */
/* -------------------------------------------------------------------------- */

export const getPatientsServer = getClientsServer
export const getPatientStatisticsServer = getClientStatisticsServer
export const getDepartmentsTableServer = getDepartmentsServer
export const getStationsTableServer = getStationsServer
export const getWorkflowsTableServer = getWorkflowsServer
export const getWorkflowServer = getWorkflowDetailServer

export async function getPublicQueueServer(): Promise<PublicQueueStation[]> {
  const response = await serverApiFetch<{ data: PublicQueueStation[] }>(
    "/public/queue"
  )
  return response.data
}

/* -------------------------------------------------------------------------- */
/* Reports                                                                    */
/* -------------------------------------------------------------------------- */

export type ReportSummary = {
  visits: {
    period: { from: string; to: string }
    total_visits: number
    completed_visits: number
    completion_rate: number
    by_status: Record<string, number>
    by_channel: Record<string, number>
    average_wait_minutes: number
  }
  queue: {
    period: { from: string; to: string }
    total_tickets: number
    served: number
    skipped: number
    no_show: number
    no_show_rate: number
    by_status: Record<string, number>
    by_station: Record<string, number>
  }
}

export async function getReportSummaryServer(
  filters: { from?: string; to?: string } = {}
): Promise<ReportSummary> {
  const response = await serverApiFetch<{ data: ReportSummary }>(
    `/reports/summary${toQuery(filters)}`
  )
  return response.data
}
