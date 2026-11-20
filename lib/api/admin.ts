import { apiFetch } from "@/lib/api/client"

import type {
  Department,
  Paginated,
  Patient,
  QueueTicket,
  Visit,
} from "@/types/reception"
import type {
  AdminStation,
  AdminVisitDetail,
  AuditFilters,
  AuditLog,
  DepartmentPayload,
  PatientFilters,
  PatientPayload,
  PublicQueueStation,
  StationPayload,
  TicketFilters,
  VisitFilters,
  Workflow,
  WorkflowPayload,
  WorkflowStep,
  WorkflowStepPayload,
} from "@/types/admin"

type QueryValue = string | number | boolean | null | undefined

function toQuery(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue
    }

    search.set(key, String(value))
  }

  const query = search.toString()

  return query ? `?${query}` : ""
}

function sendJson<T>(
  path: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown
): Promise<T> {
  return apiFetch<T>(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
}

/* -------------------------------------------------------------------------- */
/* Departments                                                                */
/* -------------------------------------------------------------------------- */

export function getDepartments(signal?: AbortSignal) {
  return apiFetch<{ data: Department[] }>("/departments", { signal })
}

export function createDepartment(payload: DepartmentPayload) {
  return sendJson<{ message: string; data: Department }>(
    "/departments",
    "POST",
    payload
  )
}

export function updateDepartment(id: number, payload: DepartmentPayload) {
  return sendJson<{ message: string; data: Department }>(
    `/departments/${id}`,
    "PUT",
    payload
  )
}

/* -------------------------------------------------------------------------- */
/* Stations                                                                   */
/* -------------------------------------------------------------------------- */

export function getStations(
  filters: { department_id?: number; type?: string } = {},
  signal?: AbortSignal
) {
  return apiFetch<{ data: AdminStation[] }>(
    `/stations${toQuery(filters)}`,
    { signal }
  )
}

export function createStation(payload: StationPayload) {
  return sendJson<{ message: string; data: AdminStation }>(
    "/stations",
    "POST",
    payload
  )
}

export function updateStation(id: number, payload: StationPayload) {
  return sendJson<{ message: string; data: AdminStation }>(
    `/stations/${id}`,
    "PUT",
    payload
  )
}

/* -------------------------------------------------------------------------- */
/* Workflows & steps                                                          */
/* -------------------------------------------------------------------------- */

export function getWorkflows(
  filters: { department_id?: number } = {},
  signal?: AbortSignal
) {
  return apiFetch<{ data: Workflow[] }>(
    `/workflows${toQuery(filters)}`,
    { signal }
  )
}

export function createWorkflow(payload: WorkflowPayload) {
  return sendJson<{ message: string; data: Workflow }>(
    "/workflows",
    "POST",
    payload
  )
}

export function getWorkflow(id: number, signal?: AbortSignal) {
  return apiFetch<{ data: Workflow }>(`/workflows/${id}`, { signal })
}

export function addWorkflowStep(
  workflowId: number,
  payload: WorkflowStepPayload
) {
  return sendJson<{ message: string; data: WorkflowStep }>(
    `/workflows/${workflowId}/steps`,
    "POST",
    payload
  )
}

export function updateWorkflowStep(
  stepId: number,
  payload: Partial<WorkflowStepPayload>
) {
  return sendJson<{ message: string; data: WorkflowStep }>(
    `/workflow-steps/${stepId}`,
    "PUT",
    payload
  )
}

export function deleteWorkflowStep(stepId: number) {
  return sendJson<{ message: string }>(
    `/workflow-steps/${stepId}`,
    "DELETE"
  )
}

/* -------------------------------------------------------------------------- */
/* Patients                                                                   */
/* -------------------------------------------------------------------------- */

export function getPatients(
  filters: PatientFilters = {},
  signal?: AbortSignal
) {
  return apiFetch<{ data: Paginated<Patient> }>(
    `/patients${toQuery(filters)}`,
    { signal }
  )
}

export function createPatient(payload: PatientPayload) {
  return sendJson<{ message: string; data: Patient }>(
    "/patients",
    "POST",
    payload
  )
}

export function updatePatient(id: number, payload: PatientPayload) {
  return sendJson<{ message: string; data: Patient }>(
    `/patients/${id}`,
    "PUT",
    payload
  )
}

/* -------------------------------------------------------------------------- */
/* Visits                                                                     */
/* -------------------------------------------------------------------------- */

export function getVisits(
  filters: VisitFilters = {},
  signal?: AbortSignal
) {
  return apiFetch<{ data: Paginated<Visit> }>(
    `/visits${toQuery(filters)}`,
    { signal }
  )
}

export function getVisitDetail(id: number, signal?: AbortSignal) {
  return apiFetch<{ data: AdminVisitDetail }>(`/visits/${id}`, { signal })
}

export function updateVisitPriority(
  id: number,
  payload: { priority: number; user_id?: string }
) {
  return sendJson<{ message: string; data: AdminVisitDetail }>(
    `/visits/${id}/priority`,
    "PATCH",
    payload
  )
}

export function cancelVisit(
  id: number,
  payload: { reason?: string; user_id?: string }
) {
  return sendJson<{ message: string; data: Visit }>(
    `/visits/${id}/cancel`,
    "POST",
    payload
  )
}

/* -------------------------------------------------------------------------- */
/* Tickets & queues                                                           */
/* -------------------------------------------------------------------------- */

export function getTickets(
  filters: TicketFilters = {},
  signal?: AbortSignal
) {
  return apiFetch<{ data: Paginated<QueueTicket> }>(
    `/tickets${toQuery(filters)}`,
    { signal }
  )
}

export function getPublicQueue(
  filters: { station_id?: number; department_id?: number } = {},
  signal?: AbortSignal
) {
  return apiFetch<{ data: PublicQueueStation[] }>(
    `/public/queue${toQuery(filters)}`,
    { signal }
  )
}

/* -------------------------------------------------------------------------- */
/* Audit logs                                                                 */
/* -------------------------------------------------------------------------- */

export function getAuditLogs(
  filters: AuditFilters = {},
  signal?: AbortSignal
) {
  return apiFetch<{ data: Paginated<AuditLog> }>(
    `/audit-logs${toQuery(filters)}`,
    { signal }
  )
}
