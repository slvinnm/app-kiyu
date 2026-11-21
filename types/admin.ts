/**
 * Admin workspace types. Master-data entities are shared with the operational
 * modules; this file adds admin-specific payloads and read models.
 */

import type { QueueEvent } from "@/types/patient"
import type {
  Department,
  Paginated,
  Patient,
  Priority,
  QueueTicket,
  Station,
  Visit,
} from "@/types/reception"

export type AdminStation = Station & {
  department?: Department | null
}

export type WorkflowStep = {
  id: number
  workflow_id: number
  station_id: number
  name: string
  sequence: number
  is_active: boolean
  is_optional: boolean
  is_repeatable: boolean
  can_skip: boolean
  completion_requirements?: unknown
  entry_conditions?: unknown
  station?: AdminStation | null
}

export type Workflow = {
  id: number
  department_id: number
  name: string
  is_active: boolean
  created_at?: string
  updated_at?: string
  department?: Department | null
  steps?: WorkflowStep[]
}

export type AuditLog = {
  id: number
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  metadata: unknown
  ip_address: string | null
  created_at?: string
  updated_at?: string
}

export type PublicQueueStation = {
  station_id: number
  station_name: string
  station_code: string
  station_type: string
  department_id: number
  department_name: string
  department_code: string
  current_calling: {
    queue_number: string
    status: string
    called_at?: string | null
  } | null
  waiting_count: number
  upcoming_queue_numbers: string[]
}

export type AdminQueueTicket = QueueTicket & {
  events?: QueueEvent[]
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

export type PatientPayload = {
  name: string
  nik?: string
  mrn?: string
  date_of_birth?: string
  gender?: string
  phone?: string
  email?: string
  address?: string
}

export type VisitFilters = {
  search?: string
  department_id?: number
  status?: string
  patient_id?: number
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

export type PatientFilters = {
  search?: string
  nik?: string
  mrn?: string
  sort?: string
  direction?: "asc" | "desc"
  page?: number
  per_page?: number
}

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
  department_id: number | null
  station_id: number | null
  created_at?: string
  updated_at?: string
  department?: Department | null
  station?: AdminStation | null
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

export type ReferralStatus = "PENDING" | "ACCEPTED" | "COMPLETED" | "CANCELLED"

export type Referral = {
  id: number
  source_visit_id: number
  target_department_id: number
  target_visit_id: number | null
  referred_by_user_id: string | null
  status: ReferralStatus
  priority: Priority
  reason: string | null
  created_at?: string
  updated_at?: string
  source_visit?: (Visit & { patient?: Patient | null }) | null
  target_department?: Department | null
  target_visit?: Visit | null
}

export type ReferralDetail = Referral & {
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
  referral: Referral
  target_visit: Visit
  target_ticket: QueueTicket
}

export type AdminPage<T> = Paginated<T>
export type { Patient, Visit }
