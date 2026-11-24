/**
 * Domain types for the non-platform workspaces (admin, receptionist, staff,
 * client). Field names follow the API's snake_case serialization.
 */

export type ApiResponse<T> = {
  message?: string
  data: T
}

export type Paginated<T> = {
  current_page: number
  data: T[]
  from: number | null
  last_page: number
  per_page: number
  to: number | null
  total: number
  next_page_url: string | null
  prev_page_url: string | null
}

export type Priority = 1 | 2 | 3

export type IntakeChannel = "KIOSK" | "MANUAL" | "ONLINE"

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
  | "AWAITING_CHECKIN"
  | "WAITING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"

/** Mirrors `App\Enums\StationType`. */
export type StationType = "INTAKE" | "SERVICE" | "CASHIER" | "COUNTER"

export type Station = {
  id: number
  department_id: number
  name: string
  code: string
  type: StationType | string
  queue_prefix: string
  is_active: boolean
  department?: Department
}

export type Department = {
  id: number
  facility_id: number
  code: string
  name: string
  is_active: boolean
  display_in_kiosk: boolean
  stations?: Station[]
  stations_count?: number
}

/**
 * A customer record (`customers` table). The only attributes are the name, the
 * optional contact details and the linked login account.
 */
export type Customer = {
  id: number
  tenant_id: number
  user_id: number | null
  name: string
  phone: string | null
  email: string | null
  address: string | null
  created_at?: string
  updated_at?: string
}

export type CustomerInput = {
  name: string
  phone?: string
  email?: string
  address?: string
}

export type CustomerDetail = Customer & { visits?: Visit[] }

/** Deprecated aliases: the API calls these "customers". Remove once call sites migrate. */
export type Client = Customer
export type ClientInput = CustomerInput
export type ClientDetail = CustomerDetail

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
  completion_requirements: unknown
  entry_conditions: unknown
  station?: Station
}

export type Workflow = {
  id: number
  department_id: number
  name: string
  is_active: boolean
  department?: Department
  steps?: WorkflowStep[]
}

export type Visit = {
  id: number
  tenant_id: number
  facility_id: number
  client_id: number | null
  department_id: number
  workflow_id: number | null
  visit_number: string
  visit_token: string
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
  client?: Client | null
  department?: Department
  workflow?: Workflow | null
  active_queue_ticket?: QueueTicket | null
}

export type QueueTicket = {
  id: number
  visit_id: number
  workflow_step_id: number | null
  station_id: number
  queue_number: string
  priority: Priority
  internal_sequence: number | null
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
  visit?: Visit
  station?: Station
  workflow_step?: WorkflowStep
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
  visit?: Visit
  department?: Department
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
  queue_tickets: QueueTicket[]
  outgoing_referrals: Referral[]
}

export type ReferralStatus = "PENDING" | "ACCEPTED" | "COMPLETED" | "CANCELLED"

export type Referral = {
  id: number
  source_visit_id: number
  target_department_id: number
  target_visit_id: number | null
  referred_by_user_id: number | null
  status: ReferralStatus
  priority: Priority
  reason: string | null
  created_at?: string
  updated_at?: string
  source_visit?: Visit
  target_department?: Department
  target_visit?: Visit | null
}

export type Facility = {
  id: number
  tenant_id: number
  name: string
  code: string
  address: string | null
  phone: string | null
  timezone: string | null
  is_active: boolean
}

export type DisplayDevice = {
  id: number
  name: string
  facility_id: number
  is_active: boolean
  /** True once the screen has redeemed a pairing code. */
  is_paired: boolean
  /** True while a pairing code is outstanding. */
  is_awaiting_pairing: boolean
  paired_at: string | null
  last_seen_at: string | null
  expires_at: string | null
}

export type KioskDevice = {
  id: number
  name: string
  facility_id: number
  is_active: boolean
  /** True once the device has redeemed a pairing code and holds a credential. */
  is_paired: boolean
  /** True while a pairing code is outstanding and not yet expired. */
  is_awaiting_pairing: boolean
  paired_at: string | null
  last_seen_at: string | null
  expires_at: string | null
}

export type Subscription = {
  id: number
  tenant_id: number
  plan_id: number
  plan_price_id: number | null
  status: string
  billing_interval: string | null
  provider: string | null
  provider_customer_id: string | null
  provider_subscription_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  trial_ends_at: string | null
  cancelled_at: string | null
  cancel_at_period_end: boolean
  plan?: Plan
}

export type Plan = {
  id: number
  code: string
  name: string
  description: string | null
  is_active: boolean
  entitlements?: PlanEntitlement[]
}

export type PlanEntitlement = {
  id: number
  plan_id: number
  feature_code: string
  value: unknown
}

export type AuditLog = {
  id: number
  tenant_id: number
  user_id: number | null
  action: string
  entity_type: string
  entity_id: string | null
  metadata: Record<string, unknown> | null
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
    called_at: string | null
  } | null
  waiting_count: number
  upcoming_queue_numbers: string[]
}

/* -------------------------------------------------------------------------- */
/* Intake results                                                             */
/* -------------------------------------------------------------------------- */

export type IntakeResult = {
  visit: Visit
  acquisition: QueueAcquisition
  ticket: QueueTicket | null
}

export type ManualIntakeResult = IntakeResult

export type CompleteRegistrationResult = {
  visit: Visit
  acquisition: QueueAcquisition
  registration_ticket: QueueTicket
  next_ticket: QueueTicket | null
}

export type CompleteRegistrationPatientData = CustomerInput
