// Customer context API client (customer role only)
import { http, type RequestOptions } from "./transport"

export async function getCustomerProfile(options: RequestOptions = {}) {
  return http("/profile", { context: "customer", ...options })
}

export async function createCustomerProfile(
  payload: { name: string; phone?: string; email?: string; address?: string },
  options: RequestOptions = {}
) {
  return http("/profile", {
    context: "customer",
    method: "POST",
    body: JSON.stringify(payload),
    ...options,
  })
}

export async function updateCustomerProfile(
  payload: { name?: string; phone?: string; email?: string; address?: string },
  options: RequestOptions = {}
) {
  return http("/profile", {
    context: "customer",
    method: "PUT",
    body: JSON.stringify(payload),
    ...options,
  })
}

export async function getCustomerQueueSessions(
  params?: { page?: number; per_page?: number; status?: string },
  options: RequestOptions = {}
) {
  return http("/queue-sessions", { context: "customer", params, ...options })
}

export async function getCustomerQueueSession(
  id: number,
  options: RequestOptions = {}
) {
  return http(`/queue-sessions/${id}`, { context: "customer", ...options })
}

export async function bookVisit(
  payload: { department_id: number; idempotency_key?: string },
  options: RequestOptions = {}
) {
  return http("/bookings", {
    context: "customer",
    method: "POST",
    body: JSON.stringify(payload),
    ...options,
  })
}
