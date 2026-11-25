import type {
  IntakeChannel,
  Priority,
  QueueTicketStatus,
  VisitStatus,
} from "@/types/reception"

const PRIORITY_LABELS: Record<number, string> = {
  1: "Normal",
  2: "Prioritas",
  3: "Darurat",
}

const TICKET_STATUS_LABELS: Record<QueueTicketStatus, string> = {
  CREATED: "Menunggu",
  CALLED: "Dipanggil",
  IN_PROGRESS: "Sedang Dilayani",
  ON_HOLD: "Ditahan",
  COMPLETED: "Selesai",
  SKIPPED: "Dilewati",
  NO_SHOW: "Tidak Hadir",
  CANCELLED: "Dibatalkan",
  TRANSFERRED: "Dipindahkan",
}

const VISIT_STATUS_LABELS: Record<VisitStatus, string> = {
  AWAITING_CHECKIN: "Menunggu Check-in",
  WAITING: "Menunggu",
  IN_PROGRESS: "Sedang Dilayani",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
}

const CHANNEL_LABELS: Record<IntakeChannel, string> = {
  MANUAL: "Manual",
  KIOSK: "Kiosk",
  ONLINE: "Online",
}

/**
 * Mirrors `App\Enums\StationType`. Neutral labels: the type says what kind of
 * work a service point does, the station's own name says where.
 */
export const STATION_TYPES = [
  "INTAKE",
  "SERVICE",
  "CASHIER",
  "COUNTER",
] as const

export type StationTypeValue = (typeof STATION_TYPES)[number]

const STATION_TYPE_LABELS: Record<StationTypeValue, string> = {
  INTAKE: "Intake",
  SERVICE: "Layanan",
  CASHIER: "Kasir",
  COUNTER: "Loket",
}

export function priorityLabel(priority: Priority | number): string {
  return PRIORITY_LABELS[priority] ?? `Prioritas ${priority}`
}

export function ticketStatusLabel(status: QueueTicketStatus): string {
  return TICKET_STATUS_LABELS[status] ?? status
}

export function visitStatusLabel(status: VisitStatus): string {
  return VISIT_STATUS_LABELS[status] ?? status
}

export function channelLabel(channel: IntakeChannel): string {
  return CHANNEL_LABELS[channel] ?? channel
}

export function stationTypeLabel(type: string | null | undefined): string {
  if (!type) {
    return "-"
  }

  return (
    STATION_TYPE_LABELS[type as StationTypeValue] ??
    // An unrecognized value is shown verbatim rather than hidden, so a backend
    // enum addition is visible instead of silently blank.
    type
  )
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDate(value: string | null | undefined): string {
  const date = parseDate(value)

  if (!date) {
    return "-"
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

export function formatDateTime(value: string | null | undefined): string {
  const date = parseDate(value)

  if (!date) {
    return "-"
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function formatTime(value: string | null | undefined): string {
  const date = parseDate(value)

  if (!date) {
    return "-"
  }

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function formatDateInput(value: string | null | undefined): string {
  const date = parseDate(value)

  if (!date) {
    return ""
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}
