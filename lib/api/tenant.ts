// Tenant context API client (facility_admin, operator, staff)
import { http, type RequestOptions } from "./transport"

// Auth
export async function getTenantUser(token?: string, tenantSlug?: string) {
  return http("/auth/me", { context: "tenant", token, tenantSlug })
}

// Intake
export async function createManualIntake(
  payload: {
    facility_id: number
    department_id: number
    priority?: number
    idempotency_key?: string
  },
  options: RequestOptions = {}
) {
  return http("/intake/manual", {
    context: "tenant",
    method: "POST",
    body: JSON.stringify(payload),
    ...options,
  })
}

export async function createOnlineIntake(
  payload: {
    facility_id: number
    customer_id: number
    department_id: number
    priority?: number
    idempotency_key?: string
  },
  options: RequestOptions = {}
) {
  return http("/intake/online", {
    context: "tenant",
    method: "POST",
    body: JSON.stringify(payload),
    ...options,
  })
}

// Reception
export async function getReceptionQueue(
  params: { facility_id?: number; department_id: number; station_id?: number },
  options: RequestOptions = {}
) {
  return http("/reception/queue", { context: "tenant", params, ...options })
}

export async function callNextReception(
  payload: { facility_id: number; department_id: number; station_id?: number },
  options: RequestOptions = {}
) {
  return http("/reception/call-next", {
    context: "tenant",
    method: "POST",
    body: JSON.stringify(payload),
    ...options,
  })
}

export async function completeRegistration(
  payload: {
    facility_id: number
    acquisition_id: number
    customer_id?: number
    customer_data?: {
      name: string
      phone?: string
      email?: string
      address?: string
    }
    priority?: number
  },
  options: RequestOptions = {}
) {
  return http("/reception/complete-registration", {
    context: "tenant",
    method: "POST",
    body: JSON.stringify(payload),
    ...options,
  })
}

export async function recallReceptionTicket(
  ticketId: number,
  facilityId: number,
  options: RequestOptions = {}
) {
  return http(`/reception/${ticketId}/recall`, {
    context: "tenant",
    method: "POST",
    facilityId,
    ...options,
  })
}

export async function skipReceptionTicket(
  ticketId: number,
  facilityId: number,
  reason?: string,
  options: RequestOptions = {}
) {
  return http(`/reception/${ticketId}/skip`, {
    context: "tenant",
    method: "POST",
    facilityId,
    body: JSON.stringify({ reason }),
    ...options,
  })
}

export async function noShowReceptionTicket(
  ticketId: number,
  facilityId: number,
  options: RequestOptions = {}
) {
  return http(`/reception/${ticketId}/no-show`, {
    context: "tenant",
    method: "POST",
    facilityId,
    ...options,
  })
}

// Queue
export async function callNextQueue(
  payload: { facility_id: number; station_id: number },
  options: RequestOptions = {}
) {
  return http("/queue/call-next", {
    context: "tenant",
    method: "POST",
    body: JSON.stringify(payload),
    ...options,
  })
}

// Tickets
export async function getTickets(
  params?: {
    facility_id?: number
    station_id?: number
    status?: string
    queue_session_id?: number
    priority?: number
    date?: string
    search?: string
    sort?: string
    direction?: string
    page?: number
    per_page?: number
  },
  options: RequestOptions = {}
) {
  return http("/tickets", { context: "tenant", params, ...options })
}

export async function getTicketStatistics(
  params?: {
    facility_id?: number
    status?: string
    station_id?: number
    date?: string
  },
  options: RequestOptions = {}
) {
  return http("/tickets/statistics", { context: "tenant", params, ...options })
}

export async function getTicket(id: number, options: RequestOptions = {}) {
  return http(`/tickets/${id}`, { context: "tenant", ...options })
}

export async function getTicketEvents(
  id: number,
  options: RequestOptions = {}
) {
  return http(`/tickets/${id}/events`, { context: "tenant", ...options })
}

export async function startTicket(
  id: number,
  facilityId: number,
  options: RequestOptions = {}
) {
  return http(`/tickets/${id}/start`, {
    context: "tenant",
    method: "POST",
    facilityId,
    ...options,
  })
}

export async function holdTicket(
  id: number,
  facilityId: number,
  notes?: string,
  options: RequestOptions = {}
) {
  return http(`/tickets/${id}/hold`, {
    context: "tenant",
    method: "POST",
    facilityId,
    body: JSON.stringify({ notes }),
    ...options,
  })
}

export async function resumeTicket(
  id: number,
  facilityId: number,
  options: RequestOptions = {}
) {
  return http(`/tickets/${id}/resume`, {
    context: "tenant",
    method: "POST",
    facilityId,
    ...options,
  })
}

export async function recallTicket(
  id: number,
  facilityId: number,
  options: RequestOptions = {}
) {
  return http(`/tickets/${id}/recall`, {
    context: "tenant",
    method: "POST",
    facilityId,
    ...options,
  })
}

export async function completeTicket(
  id: number,
  facilityId: number,
  notes?: string,
  options: RequestOptions = {}
) {
  return http(`/tickets/${id}/complete`, {
    context: "tenant",
    method: "POST",
    facilityId,
    body: JSON.stringify({ notes }),
    ...options,
  })
}

export async function skipTicket(
  id: number,
  facilityId: number,
  notes?: string,
  options: RequestOptions = {}
) {
  return http(`/tickets/${id}/skip`, {
    context: "tenant",
    method: "POST",
    facilityId,
    body: JSON.stringify({ notes }),
    ...options,
  })
}

export async function noShowTicket(
  id: number,
  facilityId: number,
  options: RequestOptions = {}
) {
  return http(`/tickets/${id}/no-show`, {
    context: "tenant",
    method: "POST",
    facilityId,
    ...options,
  })
}

export async function cancelTicket(
  id: number,
  facilityId: number,
  notes?: string,
  options: RequestOptions = {}
) {
  return http(`/tickets/${id}/cancel`, {
    context: "tenant",
    method: "POST",
    facilityId,
    body: JSON.stringify({ notes }),
    ...options,
  })
}

export async function transferTicket(
  id: number,
  payload: { target_station_id: number; notes?: string },
  facilityId: number,
  options: RequestOptions = {}
) {
  return http(`/tickets/${id}/transfer`, {
    context: "tenant",
    method: "POST",
    facilityId,
    body: JSON.stringify(payload),
    ...options,
  })
}

// Service Transfers
export async function getServiceTransfers(options: RequestOptions = {}) {
  return http("/service-transfers", { context: "tenant", ...options })
}

export async function getServiceTransfer(
  id: number,
  options: RequestOptions = {}
) {
  return http(`/service-transfers/${id}`, { context: "tenant", ...options })
}

export async function createServiceTransfer(
  payload: {
    facility_id: number
    ticket_id: number
    target_station_id: number
    reason?: string
  },
  options: RequestOptions = {}
) {
  return http("/service-transfers", {
    context: "tenant",
    method: "POST",
    body: JSON.stringify(payload),
    ...options,
  })
}

// Queue Sessions
export async function getQueueSessions(
  params?: {
    facility_id?: number
    department_id?: number
    status?: string
    date?: string
    search?: string
    sort?: string
    direction?: string
    page?: number
    per_page?: number
  },
  options: RequestOptions = {}
) {
  return http("/queue-sessions", { context: "tenant", params, ...options })
}

export async function getQueueSessionStatistics(
  params?: { facility_id?: number; date?: string },
  options: RequestOptions = {}
) {
  return http("/queue-sessions/statistics", {
    context: "tenant",
    params,
    ...options,
  })
}

export async function getQueueSession(
  id: number,
  options: RequestOptions = {}
) {
  return http(`/queue-sessions/${id}`, { context: "tenant", ...options })
}

export async function getQueueSessionAcquisition(
  id: number,
  options: RequestOptions = {}
) {
  return http(`/queue-sessions/${id}/acquisition`, {
    context: "tenant",
    ...options,
  })
}

export async function updateQueueSessionPriority(
  id: number,
  priority: 1 | 2 | 3,
  options: RequestOptions = {}
) {
  return http(`/queue-sessions/${id}/priority`, {
    context: "tenant",
    method: "PATCH",
    body: JSON.stringify({ priority }),
    ...options,
  })
}

export async function cancelQueueSession(
  id: number,
  reason?: string,
  options: RequestOptions = {}
) {
  return http(`/queue-sessions/${id}/cancel`, {
    context: "tenant",
    method: "POST",
    body: JSON.stringify({ reason }),
    ...options,
  })
}

// Customers
export async function getCustomers(
  params?: {
    search?: string
    phone?: string
    page?: number
    per_page?: number
  },
  options: RequestOptions = {}
) {
  return http("/customers", { context: "tenant", params, ...options })
}

export async function getCustomerStatistics(options: RequestOptions = {}) {
  return http("/customers/statistics", { context: "tenant", ...options })
}

export async function createCustomer(
  payload: { name: string; phone?: string; email?: string; address?: string },
  options: RequestOptions = {}
) {
  return http("/customers", {
    context: "tenant",
    method: "POST",
    body: JSON.stringify(payload),
    ...options,
  })
}

export async function getCustomer(id: number, options: RequestOptions = {}) {
  return http(`/customers/${id}`, { context: "tenant", ...options })
}

export async function updateCustomer(
  id: number,
  payload: { name?: string; phone?: string; email?: string; address?: string },
  options: RequestOptions = {}
) {
  return http(`/customers/${id}`, {
    context: "tenant",
    method: "PUT",
    body: JSON.stringify(payload),
    ...options,
  })
}

export async function getCustomerQueueSessions(
  id: number,
  options: RequestOptions = {}
) {
  return http(`/customers/${id}/queue-sessions`, {
    context: "tenant",
    ...options,
  })
}

// Queue Acquisitions
export async function getQueueAcquisitions(
  params?: {
    facility_id?: number
    department_id?: number
    status?: string
    date?: string
    search?: string
    sort?: string
    direction?: string
    page?: number
    per_page?: number
  },
  options: RequestOptions = {}
) {
  return http("/queue-acquisitions", { context: "tenant", params, ...options })
}

export async function getQueueAcquisition(
  id: number,
  options: RequestOptions = {}
) {
  return http(`/queue-acquisitions/${id}`, { context: "tenant", ...options })
}

export async function cancelQueueAcquisition(
  id: number,
  facilityId: number,
  options: RequestOptions = {}
) {
  return http(`/queue-acquisitions/${id}/cancel`, {
    context: "tenant",
    method: "POST",
    facilityId,
    ...options,
  })
}

// Departments
export async function getDepartments(
  params?: {
    facility_id?: number
    search?: string
    sort?: string
    direction?: string
    page?: number
    per_page?: number
  },
  options: RequestOptions = {}
) {
  return http("/departments", { context: "tenant", params, ...options })
}

export async function getDepartmentOptions(
  facilityId: number,
  options: RequestOptions = {}
) {
  return http("/departments/options", {
    context: "tenant",
    params: { facility_id: facilityId },
    ...options,
  })
}

export async function createDepartment(
  payload: {
    facility_id: number
    code: string
    name: string
    is_active?: boolean
    display_in_kiosk?: boolean
  },
  options: RequestOptions = {}
) {
  return http("/departments", {
    context: "tenant",
    method: "POST",
    body: JSON.stringify(payload),
    ...options,
  })
}

export async function getDepartment(id: number, options: RequestOptions = {}) {
  return http(`/departments/${id}`, { context: "tenant", ...options })
}

export async function updateDepartment(
  id: number,
  payload: {
    code?: string
    name?: string
    is_active?: boolean
    display_in_kiosk?: boolean
  },
  options: RequestOptions = {}
) {
  return http(`/departments/${id}`, {
    context: "tenant",
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
    context: "tenant",
    ...options,
  })
}

export async function getDepartmentWorkflows(
  departmentId: number,
  options: RequestOptions = {}
) {
  return http(`/departments/${departmentId}/workflows`, {
    context: "tenant",
    ...options,
  })
}

// Stations
export async function getStations(
  params?: {
    facility_id?: number
    department_id?: number
    type?: string
    search?: string
    sort?: string
    direction?: string
    page?: number
    per_page?: number
  },
  options: RequestOptions = {}
) {
  return http("/stations", { context: "tenant", params, ...options })
}

export async function getStationOptions(
  params?: { facility_id?: number; department_id?: number; type?: string },
  options: RequestOptions = {}
) {
  return http("/stations/options", { context: "tenant", params, ...options })
}

export async function createStation(
  payload: {
    facility_id: number
    department_id: number
    name: string
    code: string
    type: string
    queue_prefix?: string
    is_active?: boolean
  },
  options: RequestOptions = {}
) {
  return http("/stations", {
    context: "tenant",
    method: "POST",
    body: JSON.stringify(payload),
    ...options,
  })
}

export async function getStation(id: number, options: RequestOptions = {}) {
  return http(`/stations/${id}`, { context: "tenant", ...options })
}

export async function updateStation(
  id: number,
  payload: {
    department_id?: number
    name?: string
    code?: string
    type?: string
    queue_prefix?: string
    is_active?: boolean
  },
  options: RequestOptions = {}
) {
  return http(`/stations/${id}`, {
    context: "tenant",
    method: "PUT",
    body: JSON.stringify(payload),
    ...options,
  })
}

export async function getStationQueue(
  id: number,
  options: RequestOptions = {}
) {
  return http(`/stations/${id}/queue`, { context: "tenant", ...options })
}

// Workflows
export async function getWorkflows(
  params?: {
    facility_id?: number
    department_id?: number
    search?: string
    sort?: string
    direction?: string
    page?: number
    per_page?: number
  },
  options: RequestOptions = {}
) {
  return http("/workflows", { context: "tenant", params, ...options })
}

export async function getWorkflowStatistics(
  facilityId: number,
  options: RequestOptions = {}
) {
  return http("/workflows/statistics", {
    context: "tenant",
    params: { facility_id: facilityId },
    ...options,
  })
}

export async function createWorkflow(
  payload: {
    facility_id: number
    department_id: number
    name: string
    is_active?: boolean
  },
  options: RequestOptions = {}
) {
  return http("/workflows", {
    context: "tenant",
    method: "POST",
    body: JSON.stringify(payload),
    ...options,
  })
}

export async function getWorkflow(id: number, options: RequestOptions = {}) {
  return http(`/workflows/${id}`, { context: "tenant", ...options })
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
    context: "tenant",
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
    context: "tenant",
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
    context: "tenant",
    method: "DELETE",
    params: { facility_id: facilityId },
    ...options,
  })
}

// Devices
export async function getKioskDevices(
  params?: {
    facility_id?: number
    search?: string
    sort?: string
    direction?: string
    page?: number
    per_page?: number
  },
  options: RequestOptions = {}
) {
  return http("/kiosk-devices", { context: "tenant", params, ...options })
}

export async function createKioskDevice(
  payload: { facility_id: number; name: string; expires_at?: string },
  options: RequestOptions = {}
) {
  return http("/kiosk-devices", {
    context: "tenant",
    method: "POST",
    body: JSON.stringify(payload),
    ...options,
  })
}

export async function deleteKioskDevice(
  id: number,
  options: RequestOptions = {}
) {
  return http(`/kiosk-devices/${id}`, {
    context: "tenant",
    method: "DELETE",
    ...options,
  })
}

export async function reissueKioskPairingCode(
  id: number,
  options: RequestOptions = {}
) {
  return http(`/kiosk-devices/${id}/pairing-code`, {
    context: "tenant",
    method: "POST",
    ...options,
  })
}

export async function getDisplayDevices(
  params?: {
    facility_id?: number
    search?: string
    sort?: string
    direction?: string
    page?: number
    per_page?: number
  },
  options: RequestOptions = {}
) {
  return http("/display-devices", { context: "tenant", params, ...options })
}

export async function createDisplayDevice(
  payload: { facility_id: number; name: string; expires_at?: string },
  options: RequestOptions = {}
) {
  return http("/display-devices", {
    context: "tenant",
    method: "POST",
    body: JSON.stringify(payload),
    ...options,
  })
}

export async function deleteDisplayDevice(
  id: number,
  options: RequestOptions = {}
) {
  return http(`/display-devices/${id}`, {
    context: "tenant",
    method: "DELETE",
    ...options,
  })
}

export async function reissueDisplayPairingCode(
  id: number,
  options: RequestOptions = {}
) {
  return http(`/display-devices/${id}/pairing-code`, {
    context: "tenant",
    method: "POST",
    ...options,
  })
}

// Queue Monitor
export async function getQueueMonitor(
  params?: {
    facility_id?: number
    station_id?: number
    department_id?: number
  },
  options: RequestOptions = {}
) {
  return http("/queue/monitor", { context: "tenant", params, ...options })
}

// WhatsApp
export async function sendWhatsAppMessage(
  payload: {
    customer_id: number
    template_id?: number
    template_code?: string
    variables?: Record<string, string>
  },
  options: RequestOptions = {}
) {
  return http("/whatsapp/messages", {
    context: "tenant",
    method: "POST",
    body: JSON.stringify(payload),
    ...options,
  })
}

// Reports
export async function getReportSummary(
  facilityId: number,
  date?: string,
  options: RequestOptions = {}
) {
  return http("/reports/summary", {
    context: "tenant",
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
    context: "tenant",
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
    context: "tenant",
    params: { facility_id: facilityId, from, to },
    ...options,
  })
}

export async function getVisitDetailsReport(
  facilityId: number,
  from?: string,
  to?: string,
  options: RequestOptions = {}
) {
  return http("/reports/visit-details", {
    context: "tenant",
    params: { facility_id: facilityId, from, to },
    ...options,
  })
}

export async function getDepartmentPerformanceReport(
  facilityId: number,
  from?: string,
  to?: string,
  options: RequestOptions = {}
) {
  return http("/reports/department-performance", {
    context: "tenant",
    params: { facility_id: facilityId, from, to },
    ...options,
  })
}

export async function getWaitingTimeReport(
  facilityId: number,
  from?: string,
  to?: string,
  options: RequestOptions = {}
) {
  return http("/reports/waiting-time", {
    context: "tenant",
    params: { facility_id: facilityId, from, to },
    ...options,
  })
}

export async function getServiceDurationReport(
  facilityId: number,
  from?: string,
  to?: string,
  options: RequestOptions = {}
) {
  return http("/reports/service-duration", {
    context: "tenant",
    params: { facility_id: facilityId, from, to },
    ...options,
  })
}

export async function getQueueTrendsReport(
  facilityId: number,
  from?: string,
  to?: string,
  options: RequestOptions = {}
) {
  return http("/reports/queue-trends", {
    context: "tenant",
    params: { facility_id: facilityId, from, to },
    ...options,
  })
}

export async function getPeakHoursReport(
  facilityId: number,
  from?: string,
  to?: string,
  options: RequestOptions = {}
) {
  return http("/reports/peak-hours", {
    context: "tenant",
    params: { facility_id: facilityId, from, to },
    ...options,
  })
}

export async function getCancellationNoShowReport(
  facilityId: number,
  from?: string,
  to?: string,
  options: RequestOptions = {}
) {
  return http("/reports/cancellation-no-show", {
    context: "tenant",
    params: { facility_id: facilityId, from, to },
    ...options,
  })
}

export async function getStaffPerformanceReport(
  facilityId: number,
  from?: string,
  to?: string,
  options: RequestOptions = {}
) {
  return http("/reports/staff-performance", {
    context: "tenant",
    params: { facility_id: facilityId, from, to },
    ...options,
  })
}

export async function getFacilityComparisonReport(
  facilityId: number,
  from?: string,
  to?: string,
  options: RequestOptions = {}
) {
  return http("/reports/facility-comparison", {
    context: "tenant",
    params: { facility_id: facilityId, from, to },
    ...options,
  })
}

export async function exportQueueSessions(
  facilityId: number,
  from?: string,
  to?: string,
  options: RequestOptions = {}
) {
  return http("/reports/queue-sessions/export", {
    context: "tenant",
    params: { facility_id: facilityId, from, to },
    ...options,
  })
}

export async function exportQueueSessionsFile(
  facilityId: number,
  format: "xlsx" | "pdf",
  from?: string,
  to?: string,
  options: RequestOptions = {}
) {
  return http("/reports/queue-sessions/export-file", {
    context: "tenant",
    method: "POST",
    body: JSON.stringify({ format }),
    params: { facility_id: facilityId, from, to },
    ...options,
  })
}

export async function downloadReport(
  path: string,
  options: RequestOptions = {}
) {
  return http("/reports/download", {
    context: "tenant",
    params: { path },
    ...options,
  })
}
