/**
 * Station workspace types: queue tickets handled at a service point.
 * Domain entities are shared with the reception module because the backend
 * uses the same Visit / QueueTicket / Station models.
 */

export type {
  IntakeChannel,
  Customer,
  Priority,
  QueueTicket,
  QueueTicketStatus,
  Station,
  Visit,
  VisitStatus,
} from "@/types/reception"

import type { QueueTicket, Station, Visit } from "@/types/reception"

export type ClinicalQueueSnapshot = {
  station: Station
  tickets: QueueTicket[]
}

export type CompleteTicketResult = {
  ticket: QueueTicket
  next_ticket: QueueTicket | null
  visit: Visit
}

export type TransferTicketResult = {
  old_ticket: QueueTicket
  new_ticket: QueueTicket
}
