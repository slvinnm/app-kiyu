export class ApiError extends Error {
  status: number
  data: unknown

  constructor(status: number, message: string, data: unknown) {
    super(message)

    this.name = "ApiError"
    this.status = status
    this.data = data
  }
}

export type ApiErrorBody = {
  message?: string
  error_type?: string
  errors?: Record<string, string[]>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function getApiErrorBody(error: unknown): ApiErrorBody | null {
  return error instanceof ApiError && isRecord(error.data)
    ? (error.data as ApiErrorBody)
    : null
}

/**
 * Backend `error_type` (INVALID_STATE, INVALID_WORKFLOW, BUSINESS_CONFLICT,
 * ...) or `null`. Used to branch on specific failures.
 */
export function getApiErrorType(error: unknown): string | null {
  const type = getApiErrorBody(error)?.error_type

  return typeof type === "string" ? type : null
}

/**
 * Laravel validation errors keyed by field (e.g. `customer_data.name`).
 */
export function getApiValidationErrors(
  error: unknown
): Record<string, string[]> {
  const errors = getApiErrorBody(error)?.errors

  return isRecord(errors) ? (errors as Record<string, string[]>) : {}
}

/**
 * User-facing message. Prefers the backend message, then the error's own,
 * then the fallback.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const bodyMessage = getApiErrorBody(error)?.message

  if (typeof bodyMessage === "string" && bodyMessage.length > 0) {
    return bodyMessage
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message
  }

  return fallback
}
