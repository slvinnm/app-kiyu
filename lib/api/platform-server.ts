import "server-only"

import { serverApiFetch } from "@/lib/api/server"
import { toQuery } from "@/lib/api/query"

import type { TableFilters } from "@/lib/api/admin-server"
import type {
  GrowthReport,
  Paginated,
  PlatformAuditLog,
  PlatformDashboard,
  PlatformPayment,
  PlatformPlan,
  PlatformSettings,
  PlatformSubscription,
  PortalDashboard,
  RevenueReport,
  SubscriptionReport,
  SupportAccess,
  TenantDetail,
  TenantRow,
  WebhookEvent,
} from "@/types/platform"

/* -------------------------------------------------------------------------- */
/* Platform console                                                           */
/* -------------------------------------------------------------------------- */

export async function getPlatformDashboardServer(
  filters: { from?: string; to?: string } = {}
): Promise<PlatformDashboard> {
  const response = await serverApiFetch<{ data: PlatformDashboard }>(
    `/platform/dashboard${toQuery(filters)}`
  )
  return response.data
}

export async function getTenantsServer(
  filters: TableFilters = {}
): Promise<Paginated<TenantRow>> {
  const response = await serverApiFetch<{ data: Paginated<TenantRow> }>(
    `/platform/tenants${toQuery(filters)}`
  )
  return response.data
}

export async function getTenantDetailServer(id: number): Promise<TenantDetail> {
  const response = await serverApiFetch<{ data: TenantDetail }>(
    `/platform/tenants/${id}`
  )
  return response.data
}

export async function getPlatformSubscriptionsServer(
  filters: TableFilters = {}
): Promise<Paginated<PlatformSubscription>> {
  const response = await serverApiFetch<{
    data: Paginated<PlatformSubscription>
  }>(`/platform/subscriptions${toQuery(filters)}`)
  return response.data
}

export async function getPlatformPaymentsServer(
  filters: TableFilters = {}
): Promise<Paginated<PlatformPayment>> {
  const response = await serverApiFetch<{ data: Paginated<PlatformPayment> }>(
    `/platform/payments${toQuery(filters)}`
  )
  return response.data
}

export async function getWebhookEventsServer(
  filters: TableFilters = {}
): Promise<Paginated<WebhookEvent>> {
  const response = await serverApiFetch<{ data: Paginated<WebhookEvent> }>(
    `/platform/payments-webhooks${toQuery(filters)}`
  )
  return response.data
}

export async function getPlatformPlansServer(): Promise<PlatformPlan[]> {
  const response = await serverApiFetch<{ data: PlatformPlan[] }>(
    "/platform/plans"
  )
  return response.data
}

export async function getRevenueReportServer(
  filters: { from?: string; to?: string } = {}
): Promise<RevenueReport> {
  const response = await serverApiFetch<{ data: RevenueReport }>(
    `/platform/reports/revenue${toQuery(filters)}`
  )
  return response.data
}

export async function getGrowthReportServer(
  filters: { from?: string; to?: string } = {}
): Promise<GrowthReport> {
  const response = await serverApiFetch<{ data: GrowthReport }>(
    `/platform/reports/growth${toQuery(filters)}`
  )
  return response.data
}

export async function getSubscriptionReportServer(
  filters: { from?: string; to?: string } = {}
): Promise<SubscriptionReport> {
  const response = await serverApiFetch<{ data: SubscriptionReport }>(
    `/platform/reports/subscriptions${toQuery(filters)}`
  )
  return response.data
}

export async function getSupportAccessesServer(
  filters: TableFilters = {}
): Promise<Paginated<SupportAccess>> {
  const response = await serverApiFetch<{ data: Paginated<SupportAccess> }>(
    `/platform/support-access${toQuery(filters)}`
  )
  return response.data
}

export async function getPlatformAuditLogsServer(
  filters: TableFilters = {}
): Promise<Paginated<PlatformAuditLog>> {
  const response = await serverApiFetch<{ data: Paginated<PlatformAuditLog> }>(
    `/platform/audit-logs${toQuery(filters)}`
  )
  return response.data
}

export async function getPlatformSettingsServer(): Promise<PlatformSettings> {
  const response = await serverApiFetch<{ data: PlatformSettings }>(
    "/platform/settings"
  )
  return response.data
}

/* -------------------------------------------------------------------------- */
/* TenantAdmin portal                                                         */
/* -------------------------------------------------------------------------- */

export async function getPortalDashboardServer(
  filters: { facility_id?: number; date?: string } = {}
): Promise<PortalDashboard> {
  const response = await serverApiFetch<{ data: PortalDashboard }>(
    `/portal/dashboard${toQuery(filters)}`
  )
  return response.data
}
