import "server-only"

import { serverApiFetch } from "@/lib/api/server"
import { toQuery } from "@/lib/api/query"

import type { AdminUser } from "@/lib/api/admin"
import type {
  AuditLog,
  Customer,
  Department,
  DisplayDevice,
  Facility,
  KioskDevice,
  Paginated,
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

/**
 * One facility with its departments (portal nested navigation).
 * Facility-scoped reads send `X-Facility-Id` when the caller can reach several.
 */
/**
 * Facility-scoped reads for the nested portal navigation: the facility id is
 * named in the URL, so it is sent as `X-Facility-Id` (validated by the API)
 * instead of relying on the browser's persisted selection.
 */
function facilityHeaders(facilityId: number): RequestInit {
  return { headers: { "X-Facility-Id": String(facilityId) } }
}

export async function getFacilityDetailByIdServer(
  facilityId: number
): Promise<Facility> {
  const response = await serverApiFetch<{ data: Facility }>(
    `/facilities/${facilityId}`,
    facilityHeaders(facilityId)
  )
  return response.data
}

export async function getDepartmentDetailInFacilityServer(
  facilityId: number,
  departmentId: number
): Promise<Department> {
  const response = await serverApiFetch<{ data: Department }>(
    `/departments/${departmentId}`,
    facilityHeaders(facilityId)
  )
  return response.data
}

export async function getStationsInFacilityServer(
  facilityId: number,
  filters: TableFilters = {}
): Promise<Paginated<Station>> {
  const response = await serverApiFetch<{ data: Paginated<Station> }>(
    `/stations${toQuery(filters)}`,
    facilityHeaders(facilityId)
  )
  return response.data
}

export async function getWorkflowsInFacilityServer(
  facilityId: number,
  filters: TableFilters = {}
): Promise<Paginated<Workflow>> {
  const response = await serverApiFetch<{ data: Paginated<Workflow> }>(
    `/workflows${toQuery(filters)}`,
    facilityHeaders(facilityId)
  )
  return response.data
}

export async function getUsersInFacilityServer(
  facilityId: number,
  filters: TableFilters = {}
): Promise<Paginated<AdminUser>> {
  const response = await serverApiFetch<{ data: Paginated<AdminUser> }>(
    `/users${toQuery(filters)}`,
    facilityHeaders(facilityId)
  )
  return response.data
}

export async function getWorkflowDetailInFacilityServer(
  facilityId: number,
  workflowId: number
): Promise<Workflow> {
  const response = await serverApiFetch<{ data: Workflow }>(
    `/workflows/${workflowId}`,
    facilityHeaders(facilityId)
  )
  return response.data
}

export async function getDepartmentOptionsInFacilityServer(
  facilityId: number
): Promise<Department[]> {
  const response = await serverApiFetch<{ data: Department[] }>(
    "/departments/options",
    facilityHeaders(facilityId)
  )
  return response.data
}

export async function getFacilityDetailServer(id: number): Promise<Facility> {
  const response = await serverApiFetch<{ data: Facility }>(`/facilities/${id}`)
  return response.data
}

export async function getKioskDevicesServer(): Promise<KioskDevice[]> {
  const response = await serverApiFetch<{ data: KioskDevice[] }>(
    "/kiosk-devices"
  )
  return response.data
}

export async function getDisplayDevicesServer(): Promise<DisplayDevice[]> {
  const response = await serverApiFetch<{ data: DisplayDevice[] }>(
    "/display-devices"
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

/**
 * A single department with its stations and full workflows (steps included).
 * Backs the nested department-detail page (PRD §8.2, §8.3).
 */
export async function getDepartmentDetailServer(
  id: number
): Promise<Department> {
  const response = await serverApiFetch<{ data: Department }>(
    `/departments/${id}`
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

export async function getCustomersServer(
  filters: TableFilters = {}
): Promise<Paginated<Customer>> {
  const response = await serverApiFetch<{ data: Paginated<Customer> }>(
    `/customers${toQuery(filters)}`
  )
  return response.data
}

export async function getVisitsServer(
  filters: TableFilters = {}
): Promise<Paginated<Visit>> {
  const response = await serverApiFetch<{ data: Paginated<Visit> }>(
    `/queue-sessions${toQuery(filters)}`
  )
  return response.data
}

export async function getReferralsServer(
  filters: TableFilters = {}
): Promise<Paginated<Referral>> {
  const response = await serverApiFetch<{ data: Paginated<Referral> }>(
    `/service-transfers${toQuery(filters)}`
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
    `/queue-sessions/statistics${toQuery(filters)}`
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

export async function getCustomerStatisticsServer(): Promise<CountStatistics> {
  const response = await serverApiFetch<{ data: CountStatistics }>(
    "/customers/statistics"
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

/**
 * The tenant's resolved plan entitlements (sidebar visibility + gating).
 * Returns `null` on failure so the sidebar falls back to showing everything
 * rather than hiding a role's whole menu on a transient API blip.
 */
export async function getEntitlementsServer(): Promise<Record<
  string,
  boolean | number
> | null> {
  try {
    const response = await serverApiFetch<{
      data: Record<string, boolean | number>
    }>("/billing/entitlements")
    return response.data
  } catch {
    return null
  }
}

export type SubscriptionView = {
  subscription: Subscription | null
  is_effective: boolean
}

export type TenantPlanCatalogue = {
  plans: Array<{
    id: number
    code: string
    name: string
    description: string | null
    is_active: boolean
    is_current: boolean
    prices: Array<{
      id: number
      billing_interval: "MONTHLY" | "YEARLY"
      amount: number
      currency: string
      is_active: boolean
    }>
    entitlements: Array<{
      id: number
      feature_code: string
      value: { limit?: number } | null
    }>
  }>
  current_plan_id: number | null
  subscription_status: string | null
}

export async function getTenantPlansServer(): Promise<TenantPlanCatalogue> {
  const response = await serverApiFetch<{ data: TenantPlanCatalogue }>(
    "/billing/plans"
  )
  return response.data
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

export const getDepartmentsTableServer = getDepartmentsServer
export const getStationsTableServer = getStationsServer
export const getWorkflowsTableServer = getWorkflowsServer
export const getWorkflowServer = getWorkflowDetailServer

/**
 * Queue monitoring for the admin console. `/public/queue` is the signage
 * endpoint and resolves its tenant from a device credential, so it rejects a
 * Sanctum bearer token; this authenticated endpoint returns the same read model.
 */
export async function getQueueMonitorServer(): Promise<PublicQueueStation[]> {
  const response = await serverApiFetch<{ data: PublicQueueStation[] }>(
    "/queue/monitor"
  )
  return response.data
}

/* -------------------------------------------------------------------------- */
/* Reports                                                                    */
/* -------------------------------------------------------------------------- */

export type ReportSummary = {
  queue_sessions: {
    period: { from: string; to: string }
    total_sessions: number
    completed_sessions: number
    completion_rate: number
    by_status: Record<string, number>
    by_channel: Record<string, number>
    average_wait_minutes: number | null
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
