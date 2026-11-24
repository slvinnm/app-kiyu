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
  phone: string
  email: string
  address: string
}

export type CustomerVisit = ClientVisit
export type CustomerVisitDetail = ClientVisitDetail

/** Deprecated aliases: the API calls these "customers / queue sessions". */
export type ClientProfileAlias = ClientProfile
export type PatientAuthUser = ClientAuthUser
export type PatientProfileInput = ClientProfileInput
