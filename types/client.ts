/**
 * Client-facing types. The backend uses the same Client / Visit / QueueTicket
 * models as the staff workspaces.
 */

import type { AuthUser } from "@/types/auth"
import type {
  Client,
  QueueAcquisition,
  QueueTicket,
  Visit,
  VisitDetail,
} from "@/types/reception"

export type ClientProfile = Client

export type ClientAuthUser = AuthUser & {
  profile?: ClientProfile | null
}

export type ClientVisit = Visit

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

export type ClientQueueTicket = QueueTicket & {
  events?: QueueEvent[]
}

export type ClientVisitDetail = Omit<VisitDetail, "queue_tickets"> & {
  queue_tickets?: ClientQueueTicket[]
}

export type OnlineBookingResult = {
  visit: Visit
  acquisition: QueueAcquisition
  ticket: null
}

export type ClientProfileInput = {
  name: string
  nik: string
  date_of_birth: string
  gender: "" | "male" | "female"
  phone: string
  email: string
  address: string
}

/* Aliases kept while older client pages are migrated. */
export type PatientProfile = ClientProfile
export type PatientAuthUser = ClientAuthUser
export type PatientVisit = ClientVisit
export type PatientQueueTicket = ClientQueueTicket
export type PatientVisitDetail = ClientVisitDetail
export type PatientProfileInput = ClientProfileInput
