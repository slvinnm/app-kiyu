// Common API types shared across contexts

export interface ApiResponse<T> {
  message?: string
  data: T
  error_type?: string
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  first_page_url: string
  last_page_url: string
  next_page_url: string | null
  prev_page_url: string | null
}

export interface ApiError {
  message: string
  error_type: string
  errors?: Record<string, string[]>
}

export type HttpStatus =
  200 | 201 | 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500
