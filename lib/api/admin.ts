import { apiFetch } from "@/lib/api/client"

import type { ReferralDetail } from "@/types/admin"

import type {
  ApiResponse,
  Customer,
  CustomerInput,
  Department,
  DisplayDevice,
  Facility,
  KioskDevice,
  QueueTicket,
  Referral,
  Station,
  Subscription,
  Visit,
  Workflow,
  WorkflowStep,
} from "@/types/reception"

/* -------------------------------------------------------------------------- */
/* Departments                                                                */
/* -------------------------------------------------------------------------- */

export type DepartmentInput = {
  code: string
  name: string
  is_active?: boolean
  display_in_kiosk?: boolean
}

export function createDepartment(input: DepartmentInput) {
  return apiFetch<ApiResponse<Department>>("/departments", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updateDepartment(id: number, input: DepartmentInput) {
  return apiFetch<ApiResponse<Department>>(`/departments/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
}

/* -------------------------------------------------------------------------- */
/* Stations                                                                   */
/* -------------------------------------------------------------------------- */

export type StationInput = {
  department_id: number
  name: string
  code: string
  type: string
  queue_prefix?: string
  is_active?: boolean
}

export function createStation(input: StationInput) {
  return apiFetch<ApiResponse<Station>>("/stations", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updateStation(id: number, input: StationInput) {
  return apiFetch<ApiResponse<Station>>(`/stations/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
}

/* -------------------------------------------------------------------------- */
/* Workflows & steps                                                          */
/* -------------------------------------------------------------------------- */

export type WorkflowInput = {
  department_id: number
  name: string
  is_active?: boolean
}

export function createWorkflow(input: WorkflowInput) {
  return apiFetch<ApiResponse<Workflow>>("/workflows", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export type WorkflowStepInput = {
  station_id: number
  name: string
  sequence: number
  is_active?: boolean
}

export function addWorkflowStep(workflowId: number, input: WorkflowStepInput) {
  return apiFetch<ApiResponse<WorkflowStep>>(`/workflows/${workflowId}/steps`, {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updateWorkflowStep(id: number, input: WorkflowStepInput) {
  return apiFetch<ApiResponse<WorkflowStep>>(`/workflow-steps/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
}

export function deleteWorkflowStep(id: number) {
  return apiFetch<ApiResponse<null>>(`/workflow-steps/${id}`, {
    method: "DELETE",
  })
}

/* -------------------------------------------------------------------------- */
/* Users                                                                      */
/* -------------------------------------------------------------------------- */

export type UserInput = {
  name: string
  email: string
  password?: string
  role: string
  /** Required for facility-scoped roles; ignored for tenant_admin and client. */
  facility_ids?: number[]
  station_id?: number | null
  /** Present when managing users from inside a department (scopes validation). */
  department_id?: number | null
}

export type AdminUser = {
  id: number
  name: string
  email: string
  role: string
  station_id: number | null
  station?: Station | null
  facilities?: { id: number; name: string; code: string | null }[]
}

export function createUser(input: UserInput) {
  return apiFetch<ApiResponse<AdminUser>>("/users", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updateUser(id: number, input: UserInput) {
  return apiFetch<ApiResponse<AdminUser>>(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
}

export function deleteUser(id: number) {
  return apiFetch<ApiResponse<null>>(`/users/${id}`, { method: "DELETE" })
}

/* -------------------------------------------------------------------------- */
/* Customers                                                                  */
/* -------------------------------------------------------------------------- */

export function createCustomer(input: CustomerInput) {
  return apiFetch<ApiResponse<Customer>>("/customers", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updateCustomer(id: number, input: Partial<CustomerInput>) {
  return apiFetch<ApiResponse<Customer>>(`/customers/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
}

/* -------------------------------------------------------------------------- */
/* Visits                                                                     */
/* -------------------------------------------------------------------------- */

export function updateVisitPriority(
  visitId: number,
  payload: { priority: 1 | 2 | 3; user_id?: string }
) {
  return apiFetch<ApiResponse<Visit>>(`/queue-sessions/${visitId}/priority`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export function cancelVisit(
  visitId: number,
  payload: { reason?: string; user_id?: string } = {}
) {
  return apiFetch<ApiResponse<Visit>>(`/queue-sessions/${visitId}/cancel`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function getVisitDetail(visitId: number) {
  return apiFetch<ApiResponse<Visit>>(`/queue-sessions/${visitId}`)
}

/* -------------------------------------------------------------------------- */
/* Referrals                                                                  */
/* -------------------------------------------------------------------------- */

export type ReferralInput = {
  source_visit_id: number
  target_department_id: number
  priority?: 1 | 2 | 3
  reason?: string
  referred_by?: string
}

export type CreateReferralResult = {
  referral: Referral
  target_visit: Visit
  target_ticket: QueueTicket
}

export function createReferral(input: ReferralInput) {
  return apiFetch<ApiResponse<CreateReferralResult>>("/service-transfers", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function getReferral(id: number, signal?: AbortSignal) {
  return apiFetch<ApiResponse<ReferralDetail>>(`/service-transfers/${id}`, {
    signal,
  })
}

/* -------------------------------------------------------------------------- */
/* Facilities                                                                 */
/* -------------------------------------------------------------------------- */

export type FacilityInput = {
  name: string
  code: string
  address?: string
  phone?: string
  timezone?: string
}

export function createFacility(input: FacilityInput) {
  return apiFetch<ApiResponse<Facility>>("/facilities", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updateFacility(id: number, input: FacilityInput) {
  return apiFetch<ApiResponse<Facility>>(`/facilities/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
}

/* -------------------------------------------------------------------------- */
/* Kiosk devices                                                              */
/* -------------------------------------------------------------------------- */

export type KioskDeviceInput = {
  name: string
  expires_at?: string
}

export type KioskDeviceCreated = {
  device: KioskDevice
  pairing_code: string
}

export function createKioskDevice(input: KioskDeviceInput) {
  return apiFetch<ApiResponse<KioskDeviceCreated>>("/kiosk-devices", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function deleteKioskDevice(id: number) {
  return apiFetch<ApiResponse<null>>(`/kiosk-devices/${id}`, {
    method: "DELETE",
  })
}

/** Issue a fresh pairing code for a device that has not finished onboarding. */
export function reissueKioskPairingCode(id: number) {
  return apiFetch<ApiResponse<KioskDeviceCreated>>(
    `/kiosk-devices/${id}/pairing-code`,
    { method: "POST" }
  )
}

/* -------------------------------------------------------------------------- */
/* Display devices                                                            */
/* -------------------------------------------------------------------------- */

export type DisplayDeviceInput = {
  name: string
  expires_at?: string
}

export type DisplayDeviceCreated = {
  device: DisplayDevice
  pairing_code: string
}

export function createDisplayDevice(input: DisplayDeviceInput) {
  return apiFetch<ApiResponse<DisplayDeviceCreated>>("/display-devices", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function deleteDisplayDevice(id: number) {
  return apiFetch<ApiResponse<null>>(`/display-devices/${id}`, {
    method: "DELETE",
  })
}

/** Issue a fresh pairing code for a screen that has not finished onboarding. */
export function reissueDisplayPairingCode(id: number) {
  return apiFetch<ApiResponse<DisplayDeviceCreated>>(
    `/display-devices/${id}/pairing-code`,
    { method: "POST" }
  )
}

/* -------------------------------------------------------------------------- */
/* Billing                                                                    */
/* -------------------------------------------------------------------------- */

export type SubscriptionResponse = {
  subscription: Subscription | null
  is_effective: boolean
}

export function changeSubscription(input: {
  plan_code: string
  billing_interval: "MONTHLY" | "YEARLY"
}) {
  return apiFetch<ApiResponse<SubscriptionResponse>>("/billing/subscription", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function cancelSubscription() {
  return apiFetch<ApiResponse<SubscriptionResponse>>(
    "/billing/subscription/cancel",
    { method: "POST", body: JSON.stringify({}) }
  )
}

/* -------------------------------------------------------------------------- */
/* Reports                                                                    */
/* -------------------------------------------------------------------------- */

export type ReportSummary = {
  visits: { total: number; by_status: Record<string, number> }
  queue: { total: number; by_status: Record<string, number> }
}

export type ReportRange = { from?: string; to?: string }

export type ReportExport = {
  path: string
  format: string
  download_url: string
  expires_in_days: number
}

export function requestReportExport(
  format: "xlsx" | "pdf",
  range: ReportRange = {}
) {
  return apiFetch<ApiResponse<ReportExport>>(
    "/reports/queue-sessions/export-file",
    {
      method: "POST",
      body: JSON.stringify({ format, ...range }),
    }
  )
}

/* -------------------------------------------------------------------------- */
/* Aliases kept for existing call sites                                       */
/* -------------------------------------------------------------------------- */

export const createClient = createCustomer
export const updateClient = updateCustomer
export const createPatient = createCustomer
export const updatePatient = updateCustomer
