// App context API client (tenant_admin)
import { http, type RequestOptions } from "./transport"

// Dashboard
export async function getAppDashboard(options: RequestOptions = {}) {
  return http("/dashboard", { context: "app", ...options })
}

// Facilities
export interface FacilityCreate {
  name: string
  code: string
  address?: string
  phone?: string
  timezone?: string
  is_active?: boolean
}

export async function getFacilities(options: RequestOptions = {}) {
  return http("/facilities", { context: "app", ...options })
}

export async function createFacility(
  payload: FacilityCreate,
  options: RequestOptions = {}
) {
  return http("/facilities", {
    context: "app",
    method: "POST",
    body: JSON.stringify(payload),
    ...options,
  })
}

export async function getFacility(id: number, options: RequestOptions = {}) {
  return http(`/facilities/${id}`, { context: "app", ...options })
}

export async function updateFacility(
  id: number,
  payload: Partial<FacilityCreate>,
  options: RequestOptions = {}
) {
  return http(`/facilities/${id}`, {
    context: "app",
    method: "PUT",
    body: JSON.stringify(payload),
    ...options,
  })
}

// Users
export interface UserCreate {
  name: string
  email: string
  password: string
  role: "facility_admin" | "operator" | "staff"
  station_id?: number
  department_id?: number
  facility_ids?: number[]
}

export async function getUsers(
  params?: Record<string, string | number>,
  options: RequestOptions = {}
) {
  return http("/users", { context: "app", params, ...options })
}

export async function createUser(
  payload: UserCreate,
  options: RequestOptions = {}
) {
  return http("/users", {
    context: "app",
    method: "POST",
    body: JSON.stringify(payload),
    ...options,
  })
}

export async function getUser(id: number, options: RequestOptions = {}) {
  return http(`/users/${id}`, { context: "app", ...options })
}

export async function updateUser(
  id: number,
  payload: Partial<UserCreate>,
  options: RequestOptions = {}
) {
  return http(`/users/${id}`, {
    context: "app",
    method: "PUT",
    body: JSON.stringify(payload),
    ...options,
  })
}

export async function deleteUser(id: number, options: RequestOptions = {}) {
  return http(`/users/${id}`, { context: "app", method: "DELETE", ...options })
}

// Facility assignments
export async function getUserFacilities(
  userId: number,
  options: RequestOptions = {}
) {
  return http(`/users/${userId}/facilities`, { context: "app", ...options })
}

export async function assignUserFacility(
  userId: number,
  facilityId: number,
  options: RequestOptions = {}
) {
  return http(`/users/${userId}/facilities`, {
    context: "app",
    method: "POST",
    body: JSON.stringify({ facility_id: facilityId }),
    ...options,
  })
}

export async function unassignUserFacility(
  userId: number,
  facilityId: number,
  options: RequestOptions = {}
) {
  return http(`/users/${userId}/facilities/${facilityId}`, {
    context: "app",
    method: "DELETE",
    ...options,
  })
}

// Invitations
export async function getInvitations(options: RequestOptions = {}) {
  return http("/invitations", { context: "app", ...options })
}

export async function createInvitation(
  payload: { email: string; role: string; facility_ids?: number[] },
  options: RequestOptions = {}
) {
  return http("/invitations", {
    context: "app",
    method: "POST",
    body: JSON.stringify(payload),
    ...options,
  })
}

export async function revokeInvitation(
  id: number,
  options: RequestOptions = {}
) {
  return http(`/invitations/${id}`, {
    context: "app",
    method: "DELETE",
    ...options,
  })
}

// Departments
export interface DepartmentCreate {
  facility_id: number
  code: string
  name: string
  is_active?: boolean
  display_in_kiosk?: boolean
}

export async function getDepartments(
  params?: Record<string, string | number>,
  options: RequestOptions = {}
) {
  return http("/departments", { context: "app", params, ...options })
}

export async function getDepartmentOptions(
  facilityId: number,
  options: RequestOptions = {}
) {
  return http("/departments/options", {
    context: "app",
    params: { facility_id: facilityId },
    ...options,
  })
}

export async function createDepartment(
  payload: DepartmentCreate,
  options: RequestOptions = {}
) {
  return http("/departments", {
    context: "app",
    method: "POST",
    body: JSON.stringify(payload),
    ...options,
  })
}

export async function getDepartment(id: number, options: RequestOptions = {}) {
  return http(`/departments/${id}`, { context: "app", ...options })
}

export async function updateDepartment(
  id: number,
  payload: Partial<DepartmentCreate>,
  options: RequestOptions = {}
) {
  return http(`/departments/${id}`, {
    context: "app",
    method: "PUT",
    body: JSON.stringify(payload),
    ...options,
  })
}

export async function getDepartmentStations(
  departmentId: number,
  options: RequestOptions = {}
) {
  return http(`/departments/${departmentId}/stations`, {
    context: "app",
    ...options,
  })
}

export async function getDepartmentWorkflows(
  departmentId: number,
  options: RequestOptions = {}
) {
  return http(`/departments/${departmentId}/workflows`, {
    context: "app",
    ...options,
  })
}

// Stations
export interface StationCreate {
  facility_id: number
  department_id: number
  name: string
  code: string
  type: string
  queue_prefix?: string
  is_active?: boolean
}

export async function getStations(
  params?: Record<string, string | number>,
  options: RequestOptions = {}
) {
  return http("/stations", { context: "app", params, ...options })
}

export async function getStationOptions(
  params?: { facility_id?: number; department_id?: number; type?: string },
  options: RequestOptions = {}
) {
  return http("/stations/options", { context: "app", params, ...options })
}

export async function createStation(
  payload: StationCreate,
  options: RequestOptions = {}
) {
  return http("/stations", {
    context: "app",
    method: "POST",
    body: JSON.stringify(payload),
    ...options,
  })
}

export async function getStation(id: number, options: RequestOptions = {}) {
  return http(`/stations/${id}`, { context: "app", ...options })
}

export async function updateStation(
  id: number,
  payload: Partial<StationCreate>,
  options: RequestOptions = {}
) {
  return http(`/stations/${id}`, {
    context: "app",
    method: "PUT",
    body: JSON.stringify(payload),
    ...options,
  })
}

export async function getStationQueue(
  id: number,
  options: RequestOptions = {}
) {
  return http(`/stations/${id}/queue`, { context: "app", ...options })
}

// Workflows
export interface WorkflowCreate {
  facility_id: number
  department_id: number
  name: string
  is_active?: boolean
}

export async function getWorkflows(
  params?: Record<string, string | number>,
  options: RequestOptions = {}
) {
  return http("/workflows", { context: "app", params, ...options })
}

export async function getWorkflowStatistics(
  facilityId: number,
  options: RequestOptions = {}
) {
  return http("/workflows/statistics", {
    context: "app",
    params: { facility_id: facilityId },
    ...options,
  })
}

export async function createWorkflow(
  payload: WorkflowCreate,
  options: RequestOptions = {}
) {
  return http("/workflows", {
    context: "app",
    method: "POST",
    body: JSON.stringify(payload),
    ...options,
  })
}

export async function getWorkflow(id: number, options: RequestOptions = {}) {
  return http(`/workflows/${id}`, { context: "app", ...options })
}

export async function addWorkflowStep(
  workflowId: number,
  payload: {
    facility_id: number
    station_id: number
    name: string
    sequence: number
    is_active?: boolean
    is_optional?: boolean
    can_skip?: boolean
  },
  options: RequestOptions = {}
) {
  return http(`/workflows/${workflowId}/steps`, {
    context: "app",
    method: "POST",
    body: JSON.stringify(payload),
    ...options,
  })
}

export async function updateWorkflowStep(
  id: number,
  payload: {
    facility_id: number
    station_id?: number
    name?: string
    sequence?: number
    is_active?: boolean
    is_optional?: boolean
    can_skip?: boolean
  },
  options: RequestOptions = {}
) {
  return http(`/workflow-steps/${id}`, {
    context: "app",
    method: "PUT",
    body: JSON.stringify(payload),
    ...options,
  })
}

export async function deleteWorkflowStep(
  id: number,
  facilityId: number,
  options: RequestOptions = {}
) {
  return http(`/workflow-steps/${id}`, {
    context: "app",
    method: "DELETE",
    params: { facility_id: facilityId },
    ...options,
  })
}

// Monitoring
export async function getQueueMonitor(
  params?: Record<string, string | number>,
  options: RequestOptions = {}
) {
  return http("/queue/monitor", { context: "app", params, ...options })
}

export async function getQueueSessions(
  params?: Record<string, string | number>,
  options: RequestOptions = {}
) {
  return http("/queue-sessions", { context: "app", params, ...options })
}

export async function getQueueSessionStatistics(
  params?: { facility_id?: number; date?: string },
  options: RequestOptions = {}
) {
  return http("/queue-sessions/statistics", {
    context: "app",
    params,
    ...options,
  })
}

export async function getQueueSession(
  id: number,
  options: RequestOptions = {}
) {
  return http(`/queue-sessions/${id}`, { context: "app", ...options })
}

export async function cancelQueueSession(
  id: number,
  reason?: string,
  options: RequestOptions = {}
) {
  return http(`/queue-sessions/${id}/cancel`, {
    context: "app",
    method: "POST",
    body: JSON.stringify({ reason }),
    ...options,
  })
}

export async function getCustomers(
  params?: Record<string, string | number>,
  options: RequestOptions = {}
) {
  return http("/customers", { context: "app", params, ...options })
}

export async function getCustomerStatistics(options: RequestOptions = {}) {
  return http("/customers/statistics", { context: "app", ...options })
}

export async function getCustomer(id: number, options: RequestOptions = {}) {
  return http(`/customers/${id}`, { context: "app", ...options })
}

export async function getCustomerQueueSessions(
  id: number,
  options: RequestOptions = {}
) {
  return http(`/customers/${id}/queue-sessions`, { context: "app", ...options })
}

export async function getAuditLogs(
  params?: Record<string, string | number>,
  options: RequestOptions = {}
) {
  return http("/audit-logs", { context: "app", params, ...options })
}

// Reports
export async function getReportSummary(
  facilityId: number,
  date?: string,
  options: RequestOptions = {}
) {
  return http("/reports/summary", {
    context: "app",
    params: { facility_id: facilityId, date },
    ...options,
  })
}

export async function getQueueOverviewReport(
  facilityId: number,
  from?: string,
  to?: string,
  options: RequestOptions = {}
) {
  return http("/reports/queue-overview", {
    context: "app",
    params: { facility_id: facilityId, from, to },
    ...options,
  })
}

export async function getDailyQueueReport(
  facilityId: number,
  from?: string,
  to?: string,
  options: RequestOptions = {}
) {
  return http("/reports/daily-queue", {
    context: "app",
    params: { facility_id: facilityId, from, to },
    ...options,
  })
}

// Billing
export async function getSubscription(options: RequestOptions = {}) {
  return http("/billing/subscription", { context: "app", ...options })
}

export async function switchPlan(
  payload: {
    plan_code: string
    billing_interval: "MONTHLY" | "YEARLY"
    currency?: string
  },
  options: RequestOptions = {}
) {
  return http("/billing/subscription", {
    context: "app",
    method: "POST",
    body: JSON.stringify(payload),
    ...options,
  })
}

export async function cancelSubscription(options: RequestOptions = {}) {
  return http("/billing/subscription/cancel", {
    context: "app",
    method: "POST",
    ...options,
  })
}

export async function getEntitlements(options: RequestOptions = {}) {
  return http("/billing/entitlements", { context: "app", ...options })
}

export async function getPlans(options: RequestOptions = {}) {
  return http("/billing/plans", { context: "app", ...options })
}

export async function startPayment(options: RequestOptions = {}) {
  return http("/billing/pay", { context: "app", method: "POST", ...options })
}

export async function getPayments(
  params?: Record<string, string | number>,
  options: RequestOptions = {}
) {
  return http("/billing/payments", { context: "app", params, ...options })
}

export async function getPayment(id: number, options: RequestOptions = {}) {
  return http(`/billing/payments/${id}`, { context: "app", ...options })
}

export async function getAddons(options: RequestOptions = {}) {
  return http("/billing/addons", { context: "app", ...options })
}

export async function buyAddon(
  addonId: number,
  quantity?: number,
  options: RequestOptions = {}
) {
  return http(`/billing/addons/${addonId}`, {
    context: "app",
    method: "POST",
    body: JSON.stringify({ quantity }),
    ...options,
  })
}

export async function cancelAddon(
  addonId: number,
  options: RequestOptions = {}
) {
  return http(`/billing/addons/${addonId}/cancel`, {
    context: "app",
    method: "POST",
    ...options,
  })
}
