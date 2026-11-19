"use client"

import { useMemo, useState } from "react"
import {
  BellRingIcon,
  CheckCircle2Icon,
  CirclePauseIcon,
  Clock3Icon,
  EllipsisIcon,
  ListOrderedIcon,
  MegaphoneIcon,
  PlayIcon,
  RotateCcwIcon,
  SkipForwardIcon,
  UserRoundIcon,
  XCircleIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"

type QueueStatus =
  | "CREATED"
  | "CALLED"
  | "IN_PROGRESS"
  | "ON_HOLD"
  | "COMPLETED"
  | "SKIPPED"
  | "NO_SHOW"
  | "CANCELLED"

type QueueTicket = {
  id: number
  queue_number: string
  status: QueueStatus
  priority: "NORMAL" | "PRIORITY" | "EMERGENCY"
  visit: {
    id: number
    visit_number: string
    status: string
  }
  workflow_step: {
    id: number
    name: string
    sequence: number
  }
  patient: {
    name: string
    medical_record_number: string
  }
}

const initialWaitingQueues: QueueTicket[] = [
  {
    id: 51,
    queue_number: "A-024",
    status: "CREATED",
    priority: "NORMAL",
    visit: {
      id: 21,
      visit_number: "V-260922-00002",
      status: "WAITING",
    },
    workflow_step: {
      id: 1,
      name: "Registration",
      sequence: 1,
    },
    patient: {
      name: "Siti Aminah",
      medical_record_number: "MRN-000124",
    },
  },
  {
    id: 52,
    queue_number: "A-025",
    status: "CREATED",
    priority: "PRIORITY",
    visit: {
      id: 22,
      visit_number: "V-260922-00003",
      status: "WAITING",
    },
    workflow_step: {
      id: 1,
      name: "Registration",
      sequence: 1,
    },
    patient: {
      name: "Budi Santoso",
      medical_record_number: "MRN-000123",
    },
  },
  {
    id: 53,
    queue_number: "A-026",
    status: "CREATED",
    priority: "NORMAL",
    visit: {
      id: 23,
      visit_number: "V-260922-00004",
      status: "WAITING",
    },
    workflow_step: {
      id: 1,
      name: "Registration",
      sequence: 1,
    },
    patient: {
      name: "Amanda Clark",
      medical_record_number: "MRN-000125",
    },
  },
  {
    id: 54,
    queue_number: "A-027",
    status: "CREATED",
    priority: "NORMAL",
    visit: {
      id: 24,
      visit_number: "V-260922-00005",
      status: "WAITING",
    },
    workflow_step: {
      id: 1,
      name: "Registration",
      sequence: 1,
    },
    patient: {
      name: "Rizky Maulana",
      medical_record_number: "MRN-000126",
    },
  },
]

const initialCurrentQueue: QueueTicket = {
  id: 50,
  queue_number: "A-023",
  status: "CALLED",
  priority: "NORMAL",
  visit: {
    id: 20,
    visit_number: "V-260922-00001",
    status: "WAITING",
  },
  workflow_step: {
    id: 1,
    name: "Registration",
    sequence: 1,
  },
  patient: {
    name: "Dewi Lestari",
    medical_record_number: "MRN-000122",
  },
}

export default function Page() {
  const [currentQueue, setCurrentQueue] = useState<QueueTicket | null>(
    initialCurrentQueue
  )

  const [waitingQueues, setWaitingQueues] =
    useState<QueueTicket[]>(initialWaitingQueues)

  const [lastAction, setLastAction] = useState(
    "Queue A-023 sedang menunggu pelayanan."
  )

  const station = {
    id: 1,
    code: "REG-U",
    name: "Registration Umum",
    type: "REGISTRATION",
    department: {
      id: 1,
      code: "POLI-UMUM",
      name: "Poli Umum",
    },
  }

  const currentPosition = useMemo(() => {
    if (!currentQueue) {
      return null
    }

    const index = waitingQueues.findIndex(
      (queue) => queue.id === currentQueue.id
    )

    return index >= 0 ? index + 1 : null
  }, [currentQueue, waitingQueues])

  function callNext() {
    if (currentQueue || waitingQueues.length === 0) {
      return
    }

    const nextQueue = waitingQueues[0]

    setWaitingQueues((queues) => queues.slice(1))

    setCurrentQueue({
      ...nextQueue,
      status: "CALLED",
      visit: {
        ...nextQueue.visit,
        status: "WAITING",
      },
    })

    setLastAction(`${nextQueue.queue_number} berhasil dipanggil.`)
  }

  function startService() {
    if (!currentQueue || currentQueue.status !== "CALLED") {
      return
    }

    setCurrentQueue((queue) =>
      queue
        ? {
            ...queue,
            status: "IN_PROGRESS",
            visit: {
              ...queue.visit,
              status: "IN_PROGRESS",
            },
          }
        : null
    )

    setLastAction(`${currentQueue.queue_number} sedang dilayani.`)
  }

  function holdQueue() {
    if (
      !currentQueue ||
      !["CALLED", "IN_PROGRESS"].includes(currentQueue.status)
    ) {
      return
    }

    setCurrentQueue((queue) =>
      queue
        ? {
            ...queue,
            status: "ON_HOLD",
          }
        : null
    )

    setLastAction(`${currentQueue.queue_number} ditahan sementara.`)
  }

  function resumeQueue() {
    if (!currentQueue || currentQueue.status !== "ON_HOLD") {
      return
    }

    setCurrentQueue((queue) =>
      queue
        ? {
            ...queue,
            status: "CALLED",
          }
        : null
    )

    setLastAction(`${currentQueue.queue_number} dilanjutkan.`)
  }

  function completeQueue() {
    if (!currentQueue || currentQueue.status !== "IN_PROGRESS") {
      return
    }

    setLastAction(`${currentQueue.queue_number} telah diselesaikan.`)

    setCurrentQueue(null)
  }

  function skipQueue() {
    if (!currentQueue) {
      return
    }

    setLastAction(`${currentQueue.queue_number} dilewati.`)

    setCurrentQueue(null)
  }

  function noShowQueue() {
    if (!currentQueue) {
      return
    }

    setLastAction(`${currentQueue.queue_number} ditandai tidak hadir.`)

    setCurrentQueue(null)
  }

  function cancelQueue() {
    if (!currentQueue) {
      return
    }

    setLastAction(`${currentQueue.queue_number} dibatalkan.`)

    setCurrentQueue(null)
  }

  function handleWaitingQueueClick(queue: QueueTicket) {
    setLastAction(`${queue.queue_number} belum dapat dipanggil secara manual.`)
  }

  const currentStatusLabel = {
    CALLED: "Dipanggil",
    IN_PROGRESS: "Sedang Dilayani",
    ON_HOLD: "Ditahan",
  }[currentQueue?.status ?? "CALLED"]

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="outline">{station.code}</Badge>

                <span className="text-xs text-muted-foreground">
                  {station.name}
                </span>
              </div>

              <h1 className="text-2xl font-semibold tracking-tight">Antrian</h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Kelola dan panggil antrian pasien di station Anda.
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock3Icon className="size-4" />

              <span>22 September 2026 · 09:42</span>
            </div>
          </div>
        </div>

        {/* Station Info */}
        <Card className="mb-6">
          <CardContent className="grid gap-4 p-4 sm:grid-cols-3 sm:p-5">
            <div>
              <p className="text-xs text-muted-foreground">Station</p>

              <p className="mt-1 font-medium">{station.name}</p>

              <p className="text-xs text-muted-foreground">{station.code}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Department</p>

              <p className="mt-1 font-medium">{station.department.name}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Menunggu</p>

              <p className="mt-1 font-medium">{waitingQueues.length} queue</p>
            </div>
          </CardContent>
        </Card>

        {/* Main Queue Workspace */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_380px]">
          {/* Current Queue */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base">Antrian Saat Ini</CardTitle>

                  <CardDescription>
                    Queue yang sedang ditangani oleh station ini.
                  </CardDescription>
                </div>

                {currentQueue && (
                  <Badge variant="outline">{currentStatusLabel}</Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {currentQueue ? (
                <div className="space-y-6">
                  {/* Queue Number */}
                  <div className="rounded-xl border p-8 text-center">
                    <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                      Nomor Antrian
                    </p>

                    <p className="mt-3 text-7xl font-bold tracking-tight">
                      {currentQueue.queue_number}
                    </p>

                    <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <BellRingIcon className="size-4" />

                      <span>{currentQueue.visit.visit_number}</span>
                    </div>
                  </div>

                  {/* Patient */}
                  <div className="rounded-xl border p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border">
                        <UserRoundIcon className="size-5" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Pasien</p>

                        <p className="mt-1 text-lg font-semibold">
                          {currentQueue.patient.name}
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {currentQueue.patient.medical_record_number}
                        </p>
                      </div>

                      <Badge variant="outline" className="ml-auto shrink-0">
                        {currentQueue.priority}
                      </Badge>
                    </div>
                  </div>

                  {/* Visit Information */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Visit</p>

                      <p className="mt-1 text-sm font-medium">
                        {currentQueue.visit.visit_number}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Workflow</p>

                      <p className="mt-1 text-sm font-medium">
                        {currentQueue.workflow_step.name}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Priority</p>

                      <p className="mt-1 text-sm font-medium">
                        {currentQueue.priority}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Main Actions */}
                  <div className="space-y-3">
                    {currentQueue.status === "CALLED" && (
                      <Button
                        size="lg"
                        className="w-full"
                        onClick={startService}
                      >
                        <PlayIcon />
                        Mulai Pelayanan
                      </Button>
                    )}

                    {currentQueue.status === "ON_HOLD" && (
                      <Button
                        size="lg"
                        className="w-full"
                        onClick={resumeQueue}
                      >
                        <RotateCcwIcon />
                        Lanjutkan Pelayanan
                      </Button>
                    )}

                    {currentQueue.status === "IN_PROGRESS" && (
                      <Button
                        size="lg"
                        className="w-full"
                        onClick={completeQueue}
                      >
                        <CheckCircle2Icon />
                        Selesaikan Pelayanan
                      </Button>
                    )}

                    <div className="grid gap-2 sm:grid-cols-2">
                      {(currentQueue.status === "CALLED" ||
                        currentQueue.status === "IN_PROGRESS") && (
                        <Button variant="outline" onClick={holdQueue}>
                          <CirclePauseIcon />
                          Tahan
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="outline" className="w-full" />
                          }
                        >
                          <EllipsisIcon />
                          Tindakan Lain
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={skipQueue}>
                            <SkipForwardIcon />
                            Lewati
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={noShowQueue}>
                            <XCircleIcon />
                            Tidak Hadir
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={cancelQueue}>
                            <XCircleIcon />
                            Batalkan Antrian
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                  <div className="flex size-14 items-center justify-center rounded-full border">
                    <MegaphoneIcon className="size-6" />
                  </div>

                  <h2 className="mt-5 text-xl font-semibold">
                    Tidak ada antrian aktif
                  </h2>

                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    Panggil antrian berikutnya untuk memulai pelayanan pasien.
                  </p>

                  <Button
                    size="lg"
                    className="mt-6 min-w-52"
                    onClick={callNext}
                    disabled={!waitingQueues.length}
                  >
                    <BellRingIcon />
                    Panggil Berikutnya
                  </Button>

                  {!waitingQueues.length && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Tidak ada queue yang sedang menunggu.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Waiting Queue */}
          <Card className="h-fit">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Antrian Menunggu</CardTitle>

                  <CardDescription>
                    Daftar queue yang siap dipanggil.
                  </CardDescription>
                </div>

                <Badge variant="outline">{waitingQueues.length}</Badge>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {waitingQueues.length > 0 ? (
                <div>
                  {waitingQueues.map((queue, index) => (
                    <button
                      key={queue.id}
                      type="button"
                      onClick={() => handleWaitingQueueClick(queue)}
                      className="flex w-full items-start gap-3 border-t p-4 text-left transition-colors hover:bg-muted/50"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-md border text-xs font-medium">
                        {index + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {queue.queue_number}
                          </span>

                          {queue.priority !== "NORMAL" && (
                            <Badge variant="outline" className="text-[10px]">
                              {queue.priority}
                            </Badge>
                          )}
                        </div>

                        <p className="mt-1 truncate text-sm">
                          {queue.patient.name}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {queue.visit.visit_number}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <ListOrderedIcon className="mx-auto size-6 text-muted-foreground" />

                  <p className="mt-3 text-sm font-medium">Tidak ada antrian</p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Semua queue sudah diproses.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity */}
        <Card className="mt-6">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md border">
                <Clock3Icon className="size-4" />
              </div>

              <div>
                <p className="text-sm font-medium">Aktivitas terakhir</p>

                <p className="text-xs text-muted-foreground">{lastAction}</p>
              </div>
            </div>

            {currentPosition && (
              <Badge variant="outline">Posisi {currentPosition}</Badge>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
