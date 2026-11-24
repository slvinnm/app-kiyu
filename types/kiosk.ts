export type ApiResponse<T> = {
  message?: string
  data: T
  error_type?: string
}

export type Station = {
  id: number
  department_id?: number
  code: string | null
  name: string | null
  type: string | null
  queue_prefix?: string | null
  is_active?: boolean
}

export type Department = {
  id: number
  code: string
  name: string
  is_active?: boolean
  display_in_kiosk?: boolean
  stations?: Station[]
}

export type WorkflowStepSummary = {
  id: number
  name: string | null
  sequence: number | null
}

export type QueueTicket = {
  id: number
  visit_id: number
  workflow_step_id: number | null
  station_id: number
  queue_number: string
  internal_sequence: number | null
  priority: number
  status: string
  called_at: string | null
  started_at: string | null
  completed_at: string | null
  created_at?: string | null
  updated_at?: string | null
  station?: Station | null
  workflow_step?: WorkflowStepSummary | null
}

export type VisitDepartment = {
  id: number
  code: string
  name: string
}

export type Visit = {
  id: number
  visit_number: string
  patient_id: number | null
  department_id: number
  workflow_id: number
  intake_channel: string
  status: string
  priority: number
  online_active_key: string | null
  checked_in_at: string | null
  registered_at: string | null
  completed_at: string | null
  department?: VisitDepartment | null
}

export type QueueAcquisition = {
  id: number
  visit_id: number
  department_id: number
  channel: string
  status: string
  idempotency_key: string | null
  registered_by: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type KioskIntakeResult = {
  visit: Visit
  acquisition: QueueAcquisition
  ticket: QueueTicket
}

/**
 * Result of an online self check-in. The backend returns the visit and the
 * newly created reception ticket (no acquisition payload).
 */
export type KioskCheckinResult = {
  visit: Visit
  ticket: QueueTicket
}

/**
 * Preview returned by `GET /intake/online-lookup/{identifier}`.
 *
 * Mirrors `IntakeService::lookupOnlineBooking`. The name is masked and no other
 * customer identifier is exposed: a bare booking code is enough to recognise the
 * booking, and echoing more would let a code holder read PII.
 */
export type OnlineBookingLookup = {
  session_number: number
  customer_preview: {
    masked_name: string
  }
  department_name: string
  status: string
  is_eligible_checkin: boolean
}

export type KioskState =
  | {
      type: "idle"
    }
  | {
      type: "loading"
      departmentCode: string
    }
  | {
      type: "success"
      result: {
        visit: Visit
        ticket: QueueTicket
      }
      message: string
    }
  | {
      type: "error"
      message: string
      departmentCode: string
    }
