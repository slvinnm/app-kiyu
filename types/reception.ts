export type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

export type Patient = {
  id: number
  medical_record_number: string | null
  name: string
  date_of_birth: string | null
  gender: "male" | "female" | null
  phone: string | null
  email: string | null
  address: string | null
}

export type Department = {
  id: number
  code: string
  name: string
}

export type Station = {
  id: number | null
  code: string | null
  name: string | null
  type: string | null
}

export type QueueTicket = {
  id: number
  queue_number: string
  status: string | null
  priority: string | null
  internal_sequence: number | null
  station: Station | null
  visit: {
    id: number | null
    visit_number: string | null
    status: string | null
  } | null
  workflow_step: {
    id: number | null
    name: string | null
    sequence: number | null
  } | null
  called_at: string | null
  started_at: string | null
  completed_at: string | null
}

export type Visit = {
  id: number
  visit_number: string
  status: string | null
  priority: string | null
  intake_channel: string | null
  department: Department | null
  queue_tickets: QueueTicket[]
  checked_in_at: string | null
  completed_at: string | null
}

export type NewPatientData = {
  name: string
  email: string
  national_id: string
  date_of_birth: string
  gender: "" | "male" | "female"
  phone: string
  address: string
}

export type ReceptionVisitPayload =
  | {
      department_code: string
      patient_id: number
    }
  | {
      department_code: string
      name: string
      email: string | null
      national_id: string | null
      date_of_birth: string | null
      gender: "male" | "female" | null
      phone: string | null
      address: string | null
    }

export type WalkInSuccess = {
  patientName: string
  visit: Visit
}
