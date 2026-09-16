export type ApiSuccessResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type Department = {
  id: string;
  code: string;
  name: string;
};

export type QueueAcquisition = {
  id: string;
  department_id: string;
  visit_id: string;
  channel: string;
  status: string;
  acquired_at: string;
};

export type KioskState =
  | {
    type: "idle";
  }
  | {
    type: "loading";
    departmentCode: string;
  }
  | {
    type: "success";
    acquisition: QueueAcquisition;
    message: string;
  }
  | {
    type: "error";
    message: string;
    departmentCode: string;
  };