/**
 * Platform console (PlatformAdmin) and TenantAdmin portal read models.
 *
 * Mirrors the Laravel payloads on `/api/platform/*` and `/api/portal/*`. These
 * are presentation types only; the API remains the authority.
 */

import type { Paginated } from "@/types/reception"

export type { Paginated }

export type TenantStatus = "ACTIVE" | "SUSPENDED" | "PENDING" | "CANCELLED"

export type SubscriptionStatus =
  "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED"

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED"

export type PlanPrice = {
  id: number
  plan_id: number
  billing_interval: "MONTHLY" | "YEARLY"
  amount: number
  currency: string
  provider: string
  is_active: boolean
}

export type PlanEntitlement = {
  id: number
  plan_id: number
  feature_code: string
  value: { limit?: number } | null
}

export type PlatformPlan = {
  id: number
  code: string
  name: string
  description: string | null
  is_active: boolean
  prices: PlanPrice[]
  entitlements: PlanEntitlement[]
}

export type TenantRow = {
  id: number
  name: string
  slug: string
  status: TenantStatus
  billing_email: string | null
  contact_email: string | null
  timezone: string
  created_at: string
  facilities_count?: number
  users_count?: number
  customers_count?: number
  kiosk_devices_count?: number
  display_devices_count?: number
}

export type TenantDetail = TenantRow & {
  owner: { id: number; name: string; email: string } | null
  facilities: Array<{
    id: number
    name: string
    code: string
    is_active: boolean
  }>
  subscriptions: PlatformSubscription[]
}

export type PlatformSubscription = {
  id: number
  tenant_id: number
  plan_id: number
  status: SubscriptionStatus
  billing_interval: "MONTHLY" | "YEARLY"
  current_period_start: string | null
  current_period_end: string | null
  trial_ends_at: string | null
  cancelled_at: string | null
  cancel_at_period_end: boolean
  tenant?: { id: number; name: string; slug: string }
  plan?: PlatformPlan
}

export type PlatformPayment = {
  id: number
  subscription_id: number
  provider: string
  provider_transaction_id: string | null
  amount: number
  currency: string
  status: PaymentStatus
  paid_at: string | null
  created_at: string
  subscription?: {
    id: number
    tenant_id: number
    tenant?: { id: number; name: string; slug: string }
  }
}

export type WebhookEvent = {
  id: number
  provider: string
  event_id: string
  event_type: string
  status: "RECEIVED" | "PROCESSED" | "FAILED"
  received_at: string | null
  processed_at: string | null
  error: string | null
}

export type PlatformDashboard = {
  range: { from: string; to: string }
  tenants: {
    total: number
    by_status: Record<TenantStatus, number>
    new_in_range: number
  }
  subscriptions: {
    by_status: Record<SubscriptionStatus, number>
    effective: number
  }
  mrr: { amount: number; currency: string | null; subscriptions: number }
  collection_in_range: number
  failed_payments_in_range: number
  failed_webhooks_in_range: number
  active_plans: number
  device_usage: Array<{
    tenant_id: number
    tenant: string | null
    slug: string | null
    kiosk_devices: number
  }>
}

export type PortalDashboard = {
  tenant: { id: number; name: string; slug: string; status: TenantStatus }
  counts: {
    facilities: number
    departments: number
    stations: number
    customers: number
    sessions_today: number
    waiting: number
    in_progress: number
    completed: number
  }
  channels: Record<string, number>
  subscription: {
    id: number
    status: SubscriptionStatus
    plan: { id: number; code: string; name: string } | null
    current_period_end: string | null
    is_effective: boolean
  } | null
  usage: {
    facilities: number
    max_facilities: number
    kiosk_devices: number
    max_kiosk_devices: number
  }
}

export type SupportAccess = {
  id: number
  tenant_id: number
  reason: string
  started_at: string
  ended_at: string | null
  expires_at: string
  tenant?: { id: number; name: string; slug: string }
  platform_user?: { id: number; name: string; email: string }
}

export type PlatformSettings = {
  allow_public_signup: boolean
  reserved_subdomains: string[]
}

export type PlatformAuditLog = {
  id: number
  action: string
  entity_type: string
  entity_id: string
  metadata: unknown
  created_at: string
  tenant?: { id: number; name: string; slug: string } | null
  platform_user?: { id: number; name: string; email: string } | null
}

export type RevenueReport = {
  range: { from: string; to: string }
  series: Array<{
    month: string
    amount: number
    currency: string
    payments: number
  }>
  total: number
}

export type GrowthReport = {
  range: { from: string; to: string }
  series: Array<{ month: string; tenants: number }>
  total_tenants: number
}

export type SubscriptionReport = {
  range: { from: string; to: string }
  by_status: Record<string, number>
  by_plan: Array<{
    plan_id: number
    code: string
    name: string
    active_subscriptions: number
  }>
  churned_in_range: number
  tenant_status: Record<string, number>
}
