import { apiFetch } from "@/lib/api/client"

import type { Department, Patient, Visit } from "@/types/reception"
import type {
  AdminStation,
  AdminUser,
  AdminVisitDetail,
  CreateReferralPayload,
  CreateReferralResult,
  DepartmentPayload,
  PatientPayload,
  ReferralDetail,
  StationPayload,
  UserPayload,
  Workflow,
  WorkflowPayload,
  WorkflowStep,
  WorkflowStepPayload,
} from "@/types/admin"

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

export function createWorkflow(payload: WorkflowPayload) {
  return sendJson<{ message: string; data: Workflow }>(
    "/workflows",
    "POST",
    payload
  )
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
  return sendJson<{ message: string }>(`/workflow-steps/${stepId}`, "DELETE")
}

/* -------------------------------------------------------------------------- */
/* Patients                                                                   */
/* -------------------------------------------------------------------------- */

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
/* Staff users                                                                */
/* -------------------------------------------------------------------------- */

export function createUser(payload: UserPayload) {
  return sendJson<{ message: string; data: AdminUser }>(
    "/users",
    "POST",
    payload
  )
}

export function updateUser(id: number, payload: UserPayload) {
  return sendJson<{ message: string; data: AdminUser }>(
    `/users/${id}`,
    "PUT",
    payload
  )
}

export function deleteUser(id: number) {
  return sendJson<{ message: string }>(`/users/${id}`, "DELETE")
}

/* -------------------------------------------------------------------------- */
/* Referrals                                                                  */
/* -------------------------------------------------------------------------- */

export function getReferral(id: number, signal?: AbortSignal) {
  return apiFetch<{ data: ReferralDetail }>(`/referrals/${id}`, { signal })
}

export function createReferral(payload: CreateReferralPayload) {
  return sendJson<{ message: string; data: CreateReferralResult }>(
    "/referrals",
    "POST",
    payload
  )
}
