"use client"

import { useCallback, useState } from "react"
import { useAsyncData } from "@/hooks/use-async-data"
import { useTenantContext } from "@/contexts/tenant/tenant-context"
import { useToastManager } from "@/components/ui/toast"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { browserApi } from "@/lib/api/browser-client"
import {
  AlertCircleIcon,
  ArrowRightLeftIcon,
  CheckCircle2Icon,
  MegaphoneIcon,
  PauseCircleIcon,
  PlayIcon,
  RefreshCwIcon,
  SkipForwardIcon,
  UserXIcon,
  UsersIcon,
} from "lucide-react"

interface StationOption {
  id: number
  name: string
  code: string
  department_name?: string
}

interface StaffTicket {
  id: number
  queue_number: string
  status: string
  priority: number
  internal_sequence: number
  queue_session: {
    id: number
    customer: {
      id: number
      name: string
      phone: string | null
      email: string | null
    } | null
  } | null
  workflow_step: { id: number; name: string } | null
}

interface Paginated<T> {
  data: T[]
  total: number
}

interface StationState {
  stations: StationOption[]
  selectedStationId: number | null
}

export default function StaffWorkstationPage() {
  const { activeFacilityId, user } = useTenantContext()
  const toast = useToastManager()

  const [stationOverride, setStationOverride] = useState<StationState | null>(
    null
  )
  const [isActing, setIsActing] = useState(false)
  const [actionError, setActionError] = useState("")

  const [transferOpen, setTransferOpen] = useState(false)
  const [targetStationId, setTargetStationId] = useState("")
  const [transferNotes, setTransferNotes] = useState("")

  const stationQuery = useAsyncData<StationState>(async () => {
    if (!activeFacilityId) {
      return { stations: [], selectedStationId: null }
    }
    const opts = await browserApi<StationOption[]>(
      "tenant",
      "/stations/options",
      {
        params: { facility_id: activeFacilityId },
      }
    )
    return {
      stations: opts,
      selectedStationId: user?.station_id ?? opts[0]?.id ?? null,
    }
  }, [activeFacilityId, user?.station_id])

  const stations = stationQuery.data?.stations ?? []
  const selectedStationId =
    stationOverride?.selectedStationId ??
    stationQuery.data?.selectedStationId ??
    null

  const ticketQuery = useAsyncData<StaffTicket[]>(async () => {
    if (!activeFacilityId || !selectedStationId) return []
    const res = await browserApi<Paginated<StaffTicket>>(
      "tenant",
      `/stations/${selectedStationId}/queue`,
      { params: { facility_id: activeFacilityId, per_page: 25 } }
    )
    return res.data ?? []
  }, [activeFacilityId, selectedStationId])

  const tickets = ticketQuery.data ?? []
  const ticketsLoading = ticketQuery.isLoading
  const ticketsError = ticketQuery.error || stationQuery.error || actionError

  const reloadTickets = useCallback(async () => {
    await ticketQuery.reload()
  }, [ticketQuery])

  const runAction = useCallback(
    async (fn: () => Promise<unknown>, successTitle: string) => {
      setActionError("")
      setIsActing(true)
      try {
        await fn()
        toast.add({ title: successTitle, type: "success" })
        await ticketQuery.reload()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Action failed"
        setActionError(msg)
        toast.add({ title: "Action failed", description: msg, type: "error" })
      } finally {
        setIsActing(false)
      }
    },
    [toast, ticketQuery]
  )

  function handleCallNext() {
    if (!activeFacilityId || !selectedStationId) return
    void runAction(
      () =>
        browserApi("tenant", "/queue/call-next", {
          method: "POST",
          body: {
            facility_id: activeFacilityId,
            station_id: selectedStationId,
          },
        }),
      "Called next ticket"
    )
  }

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault()
    if (!activeFacilityId || !activeTicket || !targetStationId) return
    await runAction(async () => {
      await browserApi("tenant", `/tickets/${activeTicket.id}/transfer`, {
        method: "POST",
        body: {
          facility_id: activeFacilityId,
          target_station_id: Number(targetStationId),
          ...(transferNotes ? { notes: transferNotes } : {}),
        },
      })
      setTransferOpen(false)
      setTargetStationId("")
      setTransferNotes("")
    }, "Ticket transferred")
  }

  if (
    (ticketQuery.isLoading || stationQuery.isLoading) &&
    stations.length === 0
  ) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  if (!selectedStationId) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertCircleIcon />
          </EmptyMedia>
          <EmptyTitle>No station available</EmptyTitle>
          <EmptyDescription>
            No active station is configured for this facility. Contact your
            administrator.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const currentStation = stations.find((s) => s.id === selectedStationId)
  const activeTicket =
    tickets.find((t) =>
      ["IN_PROGRESS", "CALLED", "ON_HOLD"].includes(t.status)
    ) ?? null
  const waitingTickets = tickets.filter((t) => t.status === "CREATED")

  const stationItems = stations.map((s) => ({
    label: `${s.name} (${s.code})`,
    value: String(s.id),
  }))

  const transferStationItems = [
    { label: "Select target station", value: "" },
    ...stations
      .filter((s) => s.id !== selectedStationId)
      .map((s) => ({ label: `${s.name} (${s.code})`, value: String(s.id) })),
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Service Workstation
          </h1>
          <p className="text-sm text-muted-foreground">
            {currentStation
              ? `${currentStation.name} (${currentStation.code})`
              : "Assigned station"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {stations.length > 1 && (
            <Select
              items={stationItems}
              value={String(selectedStationId)}
              onValueChange={(v) => {
                if (v) {
                  setStationOverride({
                    stations,
                    selectedStationId: Number(v),
                  })
                }
              }}
            >
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {stationItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => void reloadTickets()}
            disabled={isActing || ticketsLoading}
          >
            <RefreshCwIcon data-icon="inline-start" />
            Refresh
          </Button>
        </div>
      </div>

      {ticketsError && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{ticketsError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>Active Ticket</CardTitle>
              <CardDescription>
                {activeTicket
                  ? "Perform the next service action below"
                  : "Ready for next customer"}
              </CardDescription>
            </div>
            {activeTicket && (
              <Badge variant="secondary">{activeTicket.status}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {activeTicket ? (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col justify-between gap-4 rounded-xl bg-muted p-6 sm:flex-row sm:items-center">
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-4xl font-bold tracking-tight">
                    {activeTicket.queue_number}
                  </span>
                  <span className="text-lg font-medium">
                    {activeTicket.queue_session?.customer?.name ??
                      "Walk-in Visitor"}
                  </span>
                  {activeTicket.queue_session?.customer?.phone && (
                    <span className="text-sm text-muted-foreground">
                      {activeTicket.queue_session.customer.phone}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-start gap-1 sm:items-end">
                  <Badge variant="outline">P{activeTicket.priority}</Badge>
                  {activeTicket.workflow_step && (
                    <span className="text-sm text-muted-foreground">
                      Step: {activeTicket.workflow_step.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {activeTicket.status === "CALLED" && (
                  <Button
                    size="lg"
                    onClick={() =>
                      void runAction(
                        () =>
                          browserApi(
                            "tenant",
                            `/tickets/${activeTicket.id}/start`,
                            {
                              method: "POST",
                              body: { facility_id: activeFacilityId },
                            }
                          ),
                        "Service started"
                      )
                    }
                    disabled={isActing}
                  >
                    {isActing ? (
                      <Spinner data-icon="inline-start" />
                    ) : (
                      <PlayIcon data-icon="inline-start" />
                    )}
                    Start Service
                  </Button>
                )}

                {activeTicket.status === "IN_PROGRESS" && (
                  <>
                    <Button
                      size="lg"
                      onClick={() =>
                        void runAction(
                          () =>
                            browserApi(
                              "tenant",
                              `/tickets/${activeTicket.id}/complete`,
                              {
                                method: "POST",
                                body: { facility_id: activeFacilityId },
                              }
                            ),
                          "Ticket completed"
                        )
                      }
                      disabled={isActing}
                    >
                      {isActing ? (
                        <Spinner data-icon="inline-start" />
                      ) : (
                        <CheckCircle2Icon data-icon="inline-start" />
                      )}
                      Complete
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() =>
                        void runAction(
                          () =>
                            browserApi(
                              "tenant",
                              `/tickets/${activeTicket.id}/hold`,
                              {
                                method: "POST",
                                body: { facility_id: activeFacilityId },
                              }
                            ),
                          "Ticket placed on hold"
                        )
                      }
                      disabled={isActing}
                    >
                      <PauseCircleIcon data-icon="inline-start" />
                      Hold
                    </Button>

                    {transferStationItems.length > 1 && (
                      <Dialog
                        open={transferOpen}
                        onOpenChange={setTransferOpen}
                      >
                        <DialogTrigger
                          render={
                            <Button
                              size="lg"
                              variant="outline"
                              disabled={isActing}
                            />
                          }
                        >
                          <ArrowRightLeftIcon data-icon="inline-start" />
                          Transfer
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              Transfer Ticket {activeTicket.queue_number}
                            </DialogTitle>
                            <DialogDescription>
                              Move this ticket to another compatible station in
                              this facility.
                            </DialogDescription>
                          </DialogHeader>
                          <form
                            onSubmit={handleTransfer}
                            className="flex flex-col gap-4"
                          >
                            <FieldGroup>
                              <Field>
                                <FieldLabel htmlFor="target_station">
                                  Target Station
                                </FieldLabel>
                                <Select
                                  items={transferStationItems}
                                  value={targetStationId}
                                  onValueChange={(v) =>
                                    setTargetStationId(v ?? "")
                                  }
                                >
                                  <SelectTrigger
                                    id="target_station"
                                    className="w-full"
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectGroup>
                                      {transferStationItems.map((item) => (
                                        <SelectItem
                                          key={item.value || "empty"}
                                          value={item.value}
                                        >
                                          {item.label}
                                        </SelectItem>
                                      ))}
                                    </SelectGroup>
                                  </SelectContent>
                                </Select>
                              </Field>
                              <Field>
                                <FieldLabel htmlFor="transfer_notes">
                                  Notes (optional)
                                </FieldLabel>
                                <Textarea
                                  id="transfer_notes"
                                  value={transferNotes}
                                  onChange={(e) =>
                                    setTransferNotes(e.target.value)
                                  }
                                  placeholder="Reason for transfer"
                                />
                              </Field>
                            </FieldGroup>
                            <DialogFooter>
                              <Button
                                type="submit"
                                disabled={isActing || !targetStationId}
                              >
                                {isActing && (
                                  <Spinner data-icon="inline-start" />
                                )}
                                Confirm Transfer
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )}
                  </>
                )}

                {activeTicket.status === "ON_HOLD" && (
                  <Button
                    size="lg"
                    onClick={() =>
                      void runAction(
                        () =>
                          browserApi(
                            "tenant",
                            `/tickets/${activeTicket.id}/resume`,
                            {
                              method: "POST",
                              body: { facility_id: activeFacilityId },
                            }
                          ),
                        "Ticket resumed"
                      )
                    }
                    disabled={isActing}
                  >
                    <PlayIcon data-icon="inline-start" />
                    Resume
                  </Button>
                )}

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() =>
                    void runAction(
                      () =>
                        browserApi(
                          "tenant",
                          `/tickets/${activeTicket.id}/recall`,
                          {
                            method: "POST",
                            body: { facility_id: activeFacilityId },
                          }
                        ),
                      "Ticket recalled"
                    )
                  }
                  disabled={isActing}
                >
                  <MegaphoneIcon data-icon="inline-start" />
                  Recall
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() =>
                    void runAction(
                      () =>
                        browserApi(
                          "tenant",
                          `/tickets/${activeTicket.id}/skip`,
                          {
                            method: "POST",
                            body: { facility_id: activeFacilityId },
                          }
                        ),
                      "Ticket skipped"
                    )
                  }
                  disabled={isActing}
                >
                  <SkipForwardIcon data-icon="inline-start" />
                  Skip
                </Button>

                <Button
                  size="lg"
                  variant="destructive"
                  onClick={() =>
                    void runAction(
                      () =>
                        browserApi(
                          "tenant",
                          `/tickets/${activeTicket.id}/no-show`,
                          {
                            method: "POST",
                            body: { facility_id: activeFacilityId },
                          }
                        ),
                      "Marked as no-show"
                    )
                  }
                  disabled={isActing}
                >
                  <UserXIcon data-icon="inline-start" />
                  No-show
                </Button>
              </div>
            </div>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UsersIcon />
                </EmptyMedia>
                <EmptyTitle>No active ticket</EmptyTitle>
                <EmptyDescription>
                  {waitingTickets.length > 0
                    ? `${waitingTickets.length} ticket(s) waiting at this station.`
                    : "No tickets waiting in queue right now."}
                </EmptyDescription>
              </EmptyHeader>
              <Button
                size="lg"
                onClick={handleCallNext}
                disabled={isActing || waitingTickets.length === 0}
              >
                {isActing ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <PlayIcon data-icon="inline-start" />
                )}
                Call Next Ticket
              </Button>
            </Empty>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Waiting Queue ({waitingTickets.length})</CardTitle>
          <CardDescription>
            Upcoming tickets assigned to this station
          </CardDescription>
        </CardHeader>
        <CardContent>
          {waitingTickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Queue is empty.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {waitingTickets.map((t) => (
                <Badge
                  key={t.id}
                  variant="secondary"
                  className="font-mono text-sm"
                >
                  {t.queue_number}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
