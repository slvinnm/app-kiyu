export type TrackingVisitStatus =
  | "AWAITING_CHECKIN"
  | "WAITING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"

export type TrackingTicketStatus =
  | "CREATED"
  | "CALLED"
  | "IN_PROGRESS"
  | "ON_HOLD"
  | "COMPLETED"
  | "SKIPPED"
  | "CANCELLED"
  | "NO_SHOW"
  | "TRANSFERRED"
  | "NOT_STARTED"

export type TrackingStation = {
  name: string
  code: string
}

export type TrackingTimestamps = {
  created_at: string | null
  called_at: string | null
  started_at: string | null
  completed_at: string | null
}

export type TrackingTicket = {
  queue_number: string
  status: TrackingTicketStatus | string
  station: TrackingStation | null
  transferred_to: TrackingStation | null
  is_current: boolean
  timestamps: TrackingTimestamps
}

export type TrackingWorkflowStep = {
  step: {
    id: number
    name: string
    sequence: number
    station: TrackingStation | null
    is_optional: boolean
    is_repeatable: boolean
    can_skip: boolean
  }
  status: TrackingTicketStatus | string
  is_current: boolean
  tickets: TrackingTicket[]
}

export type TrackingTimelineEvent = {
  type: string
  message: string
  queue_number: string
  station: TrackingStation | null
  occurred_at: string | null
}

export type TrackingAcquisition = {
  channel: string
  status: string
  department: {
    name: string
    code: string
  } | null
  created_at: string | null
  updated_at: string | null
}

export type TrackingReferral = {
  status: string
  target_department: {
    name: string
    code: string
  } | null
  target_visit: {
    visit_number: string
    status: TrackingVisitStatus | string
  } | null
  created_at: string | null
}

export type VisitTrackingData = {
  visit: {
    visit_number: string
    status: TrackingVisitStatus
    priority: number | null
    intake_channel: string | null
    timestamps: {
      created_at: string | null
      checked_in_at: string | null
      registered_at: string | null
      completed_at: string | null
    }
  }

  patient: {
    name: string | null
  }

  department: {
    name: string | null
    code: string | null
  }

  current_queue: {
    queue_number: string
    status: TrackingTicketStatus | string
    station: TrackingStation | null
    called_at: string | null
    started_at: string | null
  } | null

  journey: TrackingWorkflowStep[]
  timeline: TrackingTimelineEvent[]
  acquisitions: TrackingAcquisition[]
  referrals: TrackingReferral[]

  summary: {
    status: TrackingVisitStatus
    message: string
    completed_steps: number
    total_steps: number
    progress_percentage: number
  }
}

export type ApiResponse<T> = {
  message?: string
  data: T
}