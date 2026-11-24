/**
 * Admin workspace types. Master-data entities are shared with the operational
 * modules; this file only adds admin-specific payloads and read models.
 */

import type {
  Client,
  Department,
  Paginated,
  Priority,
  QueueTicket,
  Station,
  Visit,
} from "@/types/reception"

export type {
  AuditLog,
  Department,
  Paginated,
  PublicQueueStation,
  QueueTicket,
  Referral,
  ReferralStatus,
  Station,
  Visit,
  Workflow,
  WorkflowStep,
} from "@/types/reception"

export type AdminStation = Station & {
  department?: Department | null
}

export type AdminQueueTicket = QueueTicket & {
  events?: QueueEvent[]
}

export type QueueEvent = {
  id: number
  queue_ticket_id: number
  event_type: string
  from_status: string | null
  to_status: string | null
  user_id: string | null
  payload: unknown
  created_at?: string
  updated_at?: string
}

export type AdminVisitDetail = Visit & {
  queue_acquisitions?: unknown[]
  queue_tickets?: AdminQueueTicket[]
  outgoing_referrals?: unknown[]
}

export type DepartmentPayload = {
  code: string
  name: string
  is_active?: boolean
  display_in_kiosk?: boolean
}

export type StationPayload = {
  department_id: number
  name: string
  code: string
  type: string
  queue_prefix?: string
  is_active?: boolean
}

export type WorkflowPayload = {
  department_id: number
  name: string
  is_active?: boolean
}

export type WorkflowStepPayload = {
  station_id: number
  name: string
  sequence: number
  is_active?: boolean
  is_optional?: boolean
  is_repeatable?: boolean
  can_skip?: boolean
}

export type ClientPayload = {
  name: string
  phone?: string
  email?: string
  address?: string
}

/** @deprecated use `ClientPayload`. */
export type CustomerInput = ClientPayload

export type VisitFilters = {
  search?: string
  department_id?: number
  status?: string
  client_id?: number
  intake_channel?: string
  date?: string
  sort?: string
  direction?: "asc" | "desc"
  page?: number
  per_page?: number
}

export type AuditFilters = {
  search?: string
  action?: string
  entity_type?: string
  entity_id?: string
  user_id?: string
  sort?: string
  direction?: "asc" | "desc"
  page?: number
  per_page?: number
}

export type ClientFilters = {
  search?: string
  phone?: string
  sort?: string
  direction?: "asc" | "desc"
  page?: number
  per_page?: number
}

/** @deprecated use `ClientFilters`. */
export type CustomerFilters = ClientFilters

export type TicketFilters = {
  search?: string
  station_id?: number
  status?: string
  visit_id?: number
  priority?: Priority
  date?: string
  sort?: string
  direction?: "asc" | "desc"
  page?: number
  per_page?: number
}

/** Filters for the master-data table endpoints (paginated by the API). */
export type DepartmentFilters = {
  search?: string
  sort?: string
  direction?: "asc" | "desc"
  page?: number
  per_page?: number
}

export type StationListFilters = DepartmentFilters & {
  department_id?: number
  type?: string
}

export type WorkflowListFilters = DepartmentFilters & {
  department_id?: number
}

export type AdminUser = {
  id: number
  name: string
  email: string
  role: string
  station_id: number | null
  created_at?: string
  updated_at?: string
  station?: AdminStation | null
  facilities?: { id: number; name: string; code: string | null }[]
}

export type UserPayload = {
  name: string
  email: string
  password?: string
  role: string
  department_id?: number | null
  station_id?: number | null
}

export type UserFilters = {
  search?: string
  role?: string
  department_id?: number
  station_id?: number
  sort?: string
  direction?: "asc" | "desc"
  page?: number
  per_page?: number
}

export type ReferralDetail = {
  id: number
  source_visit_id: number
  target_department_id: number
  target_visit_id: number | null
  referred_by_user_id: string | null
  status: string
  priority: Priority
  reason: string | null
  created_at?: string
  updated_at?: string
  source_visit?: (Visit & { client?: Client | null }) | null
  target_department?: Department | null
  target_visit?: (Visit & { queue_tickets?: QueueTicket[] }) | null
}

export type ReferralFilters = {
  search?: string
  source_visit_id?: number
  target_department_id?: number
  status?: string
  sort?: string
  direction?: "asc" | "desc"
  page?: number
  per_page?: number
}

export type CreateReferralPayload = {
  source_visit_id: number
  target_department_id: number
  priority?: Priority
  reason?: string
  referred_by?: string
}

export type CreateReferralResult = {
  referral: ReferralDetail
  target_visit: Visit
  target_ticket: QueueTicket
}

export type AdminPage<T> = Paginated<T>
