export class ApiError extends Error {
  status: number
  data: unknown

  constructor(message: string, status: number, data: unknown) {
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

/**
 * Returns the structured body of an `ApiError`, when available. Laravel
 * responses use `{ message, error_type?, errors? }`.
 */
export function getApiErrorBody(error: unknown): ApiErrorBody | null {
  if (!(error instanceof ApiError) || !isRecord(error.data)) {
    return null
  }

  return error.data as ApiErrorBody
}

/**
 * Returns the backend `error_type` (INVALID_STATE, INVALID_WORKFLOW,
 * BUSINESS_CONFLICT, ...) or `null`.
 */
export function getApiErrorType(error: unknown): string | null {
  const type = getApiErrorBody(error)?.error_type

  return typeof type === "string" ? type : null
}

/**
 * Returns Laravel validation errors keyed by field (e.g. `patient_data.nik`).
 */
export function getApiValidationErrors(
  error: unknown
): Record<string, string[]> {
  const errors = getApiErrorBody(error)?.errors

  return isRecord(errors) ? (errors as Record<string, string[]>) : {}
}

/**
 * Resolves a user-facing error message. Prefers the backend message, then the
 * `ApiError` message, then the provided fallback.
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
