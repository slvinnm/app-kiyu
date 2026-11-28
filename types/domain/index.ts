// Domain types for KIYU

export type UserRole =
  | "platform_admin"
  | "tenant_admin"
  | "facility_admin"
  | "operator"
  | "staff"
  | "customer"

export type ApplicationContext =
  "public" | "app" | "tenant" | "customer" | "portal" | "devices"

export interface Tenant {
  id: number
  name: string
  slug: string
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING" | "CANCELLED"
  timezone: string
}

export interface TenantPublic {
  id: number
  name: string
  slug: string
  status: string
  timezone: string
  allow_public_registration: boolean
}

export interface FacilitySummary {
  id: number
  name: string
  code: string
}

export interface Facility extends FacilitySummary {
  address?: string | null
  phone?: string | null
  timezone: string
  is_active: boolean
  departments?: Department[]
  stations?: Station[]
}

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  tenant_id: number | null
  tenant: Tenant | null
  facilities: FacilitySummary[]
  facility_ids: number[]
  station_id: number | null
  profile: CustomerProfile | null
}

export interface Department {
  id: number
  facility_id: number
  code: string
  name: string
  is_active: boolean
  display_in_kiosk: boolean
}

export type StationType = string // TODO: enumerate from backend schema

export interface Station {
  id: number
  facility_id: number
  department_id: number
  name: string
  code: string
  type: StationType
  queue_prefix: string | null
  is_active: boolean
}

export interface WorkflowStep {
  id: number
  workflow_id: number
  station_id: number
  name: string
  sequence: number
  is_active: boolean
  is_optional: boolean
  can_skip: boolean
}

export interface Workflow {
  id: number
  facility_id: number
  department_id: number
  name: string
  is_active: boolean
  steps?: WorkflowStep[]
  steps_count?: number
}

export interface CustomerProfile {
  id: number
  name: string
  phone: string | null
  email: string | null
  address: string | null
}

export type QueueSessionStatus = string // TODO: enumerate

export interface QueueSession {
  id: number
  facility_id: number
  department_id: number
  customer_id: number | null
  status: QueueSessionStatus
  priority: number
  created_at: string
  updated_at: string
}

export type TicketStatus = string // TODO: enumerate

export interface Ticket {
  id: number
  queue_session_id: number
  station_id: number
  status: TicketStatus
  created_at: string
  updated_at: string
}
