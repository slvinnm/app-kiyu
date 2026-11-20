/**
 * Domain types for the receptionist workspace, aligned with the KIYU Laravel
 * API (see /home/slvinnm/Lerd/kiyu). Field names follow the backend's
 * snake_case serialization; `priority` is an integer and `station_id` is
 * always present on queue tickets.
 */

export type ApiResponse<T> = {
  message?: string
  data: T
  error_type?: string
  errors?: Record<string, string[]>
}

export type Paginated<T> = {
  current_page: number
  data: T[]
  first_page_url: string
  from: number | null
  last_page: number
  last_page_url: string
  links: Array<{ url: string | null; label: string; active: boolean }>
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number | null
  total: number
}

export type PaginatedResponse<T> = {
  data: Paginated<T>
}

export type Priority = 1 | 2 | 3

export type IntakeChannel = "MANUAL" | "KIOSK" | "ONLINE"

export type QueueAcquisitionStatus = "ACQUIRED" | "REGISTERED" | "CANCELLED"

export type QueueTicketStatus =
  | "CREATED"
  | "CALLED"
  | "IN_PROGRESS"
  | "ON_HOLD"
  | "COMPLETED"
  | "SKIPPED"
  | "NO_SHOW"
  | "CANCELLED"
  | "TRANSFERRED"

export type VisitStatus =
  "AWAITING_CHECKIN" | "WAITING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"

export type Station = {
  id: number
  department_id: number
  code: string
  name: string
  type: string
  queue_prefix: string
  is_active: boolean
}

export type Department = {
  id: number
  code: string
  name: string
  is_active: boolean
  display_in_kiosk?: boolean
  stations?: Station[]
}

export type Patient = {
  id: number
  user_id: number | null
  mrn: string | null
  nik: string | null
  name: string
  date_of_birth: string | null
  gender: string | null
  phone: string | null
  email: string | null
  address: string | null
}

export type WorkflowStepSummary = {
  id: number
  workflow_id: number
  station_id: number
  name: string
  sequence: number
  is_active: boolean
}

export type Visit = {
  id: number
  patient_id: number | null
  department_id: number
  workflow_id: number
  visit_number: string
  priority: Priority
  intake_channel: IntakeChannel
  status: VisitStatus
  online_active_key: string | null
  registered_by: string | null
  checked_in_at: string | null
  registered_at: string | null
  completed_at: string | null
  created_at?: string
  updated_at?: string
  patient?: Patient | null
  department?: Department | null
}

export type QueueAcquisition = {
  id: number
  visit_id: number
  department_id: number
  channel: IntakeChannel
  status: QueueAcquisitionStatus
  idempotency_key: string | null
  registered_by: string | null
  created_at?: string
  updated_at?: string
  visit?: Visit | null
  department?: Department | null
}

export type QueueTicket = {
  id: number
  visit_id: number
  workflow_step_id: number
  station_id: number
  queue_number: string
  priority: Priority
  internal_sequence: number
  status: QueueTicketStatus
  assigned_to: string | null
  transferred_from_ticket_id: number | null
  transferred_to_station_id: number | null
  notes: string | null
  called_at: string | null
  started_at: string | null
  completed_at: string | null
  created_at?: string
  updated_at?: string
  station?: Station | null
  workflow_step?: WorkflowStepSummary | null
  visit?: Visit | null
}

export type ReceptionQueueSnapshot = {
  station: Station
  current_calling: QueueTicket | null
  waiting: QueueTicket[]
  waiting_count: number
  called_count_today: number
  on_hold: QueueTicket[]
}

export type VisitDetail = Visit & {
  queue_acquisitions: QueueAcquisition[]
  queue_tickets?: QueueTicket[]
}

export type PatientVisit = Visit & {
  active_queue_ticket?: QueueTicket | null
}

export type PatientDetail = Patient & {
  visits?: PatientVisit[]
  active_queue_ticket?: QueueTicket | null
}

export type PatientInput = {
  name: string
  nik: string
  date_of_birth: string
  gender: "" | "male" | "female"
  phone: string
  email: string
  address: string
}

export type CompleteRegistrationPatientData = {
  name: string
  nik?: string
  mrn?: string
  date_of_birth?: string
  gender?: string
  phone?: string
  email?: string
  address?: string
}

export type ManualIntakeResult = {
  visit: Visit
  acquisition: QueueAcquisition
  ticket: QueueTicket
}

export type CompleteRegistrationResult = {
  visit: Visit
  acquisition: QueueAcquisition
  registration_ticket: QueueTicket
  next_ticket: QueueTicket | null
}
