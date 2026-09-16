export type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

export type Department = {
  id: string
  code: string
  name: string
}

export type QueueTicket = {
  id: string
  queue_number: string
  status: string
}

export type Visit = {
  id: string
  visit_number: string
}

export type QueueAcquisition = {
  id: string
  department_id: string
  visit_id: string
  channel: string
  status: string
  acquired_at: string
  department: Department
  visit: Visit
  queue_ticket: QueueTicket
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
      acquisition: QueueAcquisition
      message: string
    }
  | {
      type: "error"
      message: string
      departmentCode: string
    }
