/**
 * Patient-facing types. The backend uses the same Patient / Visit /
 * QueueTicket models as the staff workspaces.
 */

import type { AuthUser } from "@/types/auth"
import type {
  Patient,
  QueueAcquisition,
  QueueTicket,
  Visit,
  VisitDetail,
} from "@/types/reception"

export type PatientProfile = Patient

export type PatientAuthUser = AuthUser & {
  profile?: PatientProfile | null
}

export type PatientVisit = Visit

export type QueueEvent = {
  id: number
  queue_ticket_id: number
  event_type: string
  from_status: string | null
  to_status: string | null
  user_id: string | null
  payload: unknown
  created_at?: string
  updated_at?: string
}

export type PatientQueueTicket = QueueTicket & {
  events?: QueueEvent[]
}

export type PatientVisitDetail = Omit<VisitDetail, "queue_tickets"> & {
  queue_tickets?: PatientQueueTicket[]
}

export type OnlineBookingResult = {
  visit: Visit
  acquisition: QueueAcquisition
  ticket: null
}

export type PatientProfileInput = {
  name: string
  nik: string
  date_of_birth: string
  gender: "" | "male" | "female"
  phone: string
  email: string
  address: string
}
