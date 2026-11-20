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
  department_name: string
  current_calling: {
    queue_number: string
    status: string
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
  department_id?: number
  status?: string
  patient_id?: number
  intake_channel?: string
  date?: string
  page?: number
  per_page?: number
}

export type AuditFilters = {
  action?: string
  entity_type?: string
  entity_id?: string
  user_id?: string
  page?: number
  per_page?: number
}

export type PatientFilters = {
  search?: string
  nik?: string
  mrn?: string
  page?: number
  per_page?: number
}

export type TicketFilters = {
  station_id?: number
  status?: string
  visit_id?: number
  priority?: Priority
  date?: string
  page?: number
  per_page?: number
}

export type AdminPage<T> = Paginated<T>
export type { Patient, Visit }
