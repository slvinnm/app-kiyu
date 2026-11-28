"use client"

import { useCallback, useEffect, useState } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { browserApi } from "@/lib/api/browser-client"
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ClockIcon,
  PauseCircleIcon,
  PlayIcon,
  PlusIcon,
  RefreshCwIcon,
  SkipForwardIcon,
  UserPlusIcon,
  UserXIcon,
  UsersIcon,
} from "lucide-react"

interface CustomerRef {
  id: number
  name: string
  phone: string | null
  email: string | null
}

interface TicketRow {
  id: number
  queue_number: string
  status: string
  priority: number
  internal_sequence: number
  called_at: string | null
  queue_session: {
    id: number
    queue_acquisition_id?: number | null
    customer: CustomerRef | null
  } | null
  workflow_step: { name: string } | null
}

interface ReceptionQueue {
  station: { id: number; name: string; code: string } | null
  current_calling: TicketRow | null
  waiting: TicketRow[]
  waiting_count: number
  called_count_today: number
  on_hold: TicketRow[]
}

interface DepartmentOption {
  id: number
  name: string
  code: string
}

interface Acquisition {
  id: number
  status: string
  channel?: string
  priority: number
  queue_session: { customer: CustomerRef | null } | null
}

const PRIORITY_ITEMS = [
  { label: "Normal (P1)", value: "1" },
  { label: "Priority (P2)", value: "2" },
  { label: "Urgent (P3)", value: "3" },
]

export function ReceptionWorkspace() {
  const { activeFacilityId } = useTenantContext()
  const toast = useToastManager()

  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    number | null
  >(null)
  const [queue, setQueue] = useState<ReceptionQueue | null>(null)
  const [acquisitions, setAcquisitions] = useState<Acquisition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isActing, setIsActing] = useState(false)
  const [error, setError] = useState("")

  // Walk-in intake dialog
  const [intakeOpen, setIntakeOpen] = useState(false)
  const [intakePriority, setIntakePriority] = useState("1")

  // Complete registration dialog
  const [regOpen, setRegOpen] = useState(false)
  const [regAcquisitionId, setRegAcquisitionId] = useState<number | null>(null)
  const [custName, setCustName] = useState("")
  const [custPhone, setCustPhone] = useState("")
  const [custEmail, setCustEmail] = useState("")

  const loadQueueAndAcquisitions = useCallback(
    async (deptId: number) => {
      if (!activeFacilityId) return
      const [q, acq] = await Promise.all([
        browserApi<ReceptionQueue>("tenant", "/reception/queue", {
          params: { facility_id: activeFacilityId, department_id: deptId },
        }),
        browserApi<{ data: Acquisition[] }>("tenant", "/queue-acquisitions", {
          params: { facility_id: activeFacilityId, per_page: 50 },
        }),
      ])
      setQueue(q)
      setAcquisitions(acq.data ?? [])
    },
    [activeFacilityId]
  )

  useEffect(() => {
    if (!activeFacilityId) return
    let cancelled = false

    async function init() {
      setIsLoading(true)
      setError("")
      setQueue(null)
      try {
        const opts = await browserApi<DepartmentOption[]>(
          "tenant",
          "/departments/options",
          {
            params: { facility_id: activeFacilityId! },
          }
        )
        if (cancelled) return
        setDepartments(opts)
        const firstId = opts[0]?.id ?? null
        setSelectedDepartmentId(firstId)
        if (firstId) {
          await loadQueueAndAcquisitions(firstId)
        }
      } catch (err: unknown) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load reception"
          )
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void init()
    return () => {
      cancelled = true
    }
  }, [activeFacilityId, loadQueueAndAcquisitions])

  async function refresh() {
    if (!selectedDepartmentId) return
    setError("")
    try {
      await loadQueueAndAcquisitions(selectedDepartmentId)
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to refresh reception"
      )
    }
  }

  async function selectDepartment(deptId: number) {
    setSelectedDepartmentId(deptId)
    setError("")
    try {
      await loadQueueAndAcquisitions(deptId)
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load department queue"
      )
    }
  }

  async function runAction(fn: () => Promise<unknown>, successTitle: string) {
    setError("")
    setIsActing(true)
    try {
      await fn()
      toast.add({ title: successTitle, type: "success" })
      if (selectedDepartmentId) {
        await loadQueueAndAcquisitions(selectedDepartmentId)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Operation failed"
      setError(msg)
      toast.add({ title: "Action failed", description: msg, type: "error" })
    } finally {
      setIsActing(false)
    }
  }

  async function handleManualIntake(e: React.FormEvent) {
    e.preventDefault()
    if (!activeFacilityId || !selectedDepartmentId) return
    await runAction(async () => {
      await browserApi("tenant", "/intake/manual", {
        method: "POST",
        body: {
          facility_id: activeFacilityId,
          department_id: selectedDepartmentId,
          priority: Number(intakePriority),
          idempotency_key: crypto.randomUUID(),
        },
      })
      setIntakeOpen(false)
    }, "Walk-in ticket created")
  }

  async function handleCompleteRegistration(e: React.FormEvent) {
    e.preventDefault()
    if (!activeFacilityId || !regAcquisitionId) return
    await runAction(async () => {
      await browserApi("tenant", "/reception/complete-registration", {
        method: "POST",
        body: {
          facility_id: activeFacilityId,
          acquisition_id: regAcquisitionId,
          customer_data: {
            name: custName,
            ...(custPhone ? { phone: custPhone } : {}),
            ...(custEmail ? { email: custEmail } : {}),
          },
          priority: 1,
        },
      })
      setRegOpen(false)
      setCustName("")
      setCustPhone("")
      setCustEmail("")
      setRegAcquisitionId(null)
    }, "Registration completed")
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    )
  }

  if (departments.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UsersIcon />
          </EmptyMedia>
          <EmptyTitle>No departments configured</EmptyTitle>
          <EmptyDescription>
            Create a department and registration workflow before operating
            reception.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const current = queue?.current_calling ?? null
  const pendingAcquisitions = acquisitions.filter(
    (a) => a.status !== "CANCELLED"
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reception</h1>
          <p className="text-sm text-muted-foreground">
            {queue?.station
              ? `${queue.station.name} (${queue.station.code})`
              : "Front desk intake"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refresh()}
            disabled={isActing}
          >
            <RefreshCwIcon data-icon="inline-start" />
            Refresh
          </Button>
          <Dialog open={intakeOpen} onOpenChange={setIntakeOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <PlusIcon data-icon="inline-start" />
              Walk-in Intake
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Walk-in Intake</DialogTitle>
                <DialogDescription>
                  Issue a queue ticket for a walk-in visitor in{" "}
                  {departments.find((d) => d.id === selectedDepartmentId)?.name}
                  .
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={handleManualIntake}
                className="flex flex-col gap-4"
              >
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="intake_priority">Priority</FieldLabel>
                    <Select
                      items={PRIORITY_ITEMS}
                      value={intakePriority}
                      onValueChange={(v) => setIntakePriority(v ?? "1")}
                    >
                      <SelectTrigger id="intake_priority" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {PRIORITY_ITEMS.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                              {p.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>
                <DialogFooter>
                  <Button type="submit" disabled={isActing}>
                    {isActing && <Spinner data-icon="inline-start" />}
                    Create Ticket
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        {departments.map((d) => (
          <Button
            key={d.id}
            size="sm"
            variant={selectedDepartmentId === d.id ? "default" : "outline"}
            onClick={() => void selectDepartment(d.id)}
          >
            {d.name}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Waiting</CardTitle>
            <UsersIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {queue?.waiting_count ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">In reception queue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Current Ticket
            </CardTitle>
            <ClockIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {current?.queue_number ?? "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {current?.queue_session?.customer?.name ??
                (current ? "Walk-in" : "None called")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Called Today</CardTitle>
            <CheckCircle2Icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {queue?.called_count_today ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Processed at desk</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <CardTitle>Active Reception Call</CardTitle>
            <CardDescription>
              {current
                ? `Serving ticket ${current.queue_number}`
                : "Call the next waiting ticket to begin registration"}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() =>
                void runAction(
                  () =>
                    browserApi("tenant", "/reception/call-next", {
                      method: "POST",
                      body: {
                        facility_id: activeFacilityId,
                        department_id: selectedDepartmentId,
                      },
                    }),
                  "Next ticket called"
                )
              }
              disabled={isActing || (queue?.waiting_count ?? 0) === 0}
            >
              <PlayIcon data-icon="inline-start" />
              Call Next
            </Button>
            {current && (
              <>
                <Button
                  variant="outline"
                  onClick={() =>
                    void runAction(
                      () =>
                        browserApi(
                          "tenant",
                          `/reception/${current.id}/recall`,
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
                  <PauseCircleIcon data-icon="inline-start" />
                  Recall
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    void runAction(
                      () =>
                        browserApi("tenant", `/reception/${current.id}/skip`, {
                          method: "POST",
                          body: {
                            facility_id: activeFacilityId,
                            reason: "Skipped at reception",
                          },
                        }),
                      "Ticket skipped"
                    )
                  }
                  disabled={isActing}
                >
                  <SkipForwardIcon data-icon="inline-start" />
                  Skip
                </Button>
                <Button
                  variant="destructive"
                  onClick={() =>
                    void runAction(
                      () =>
                        browserApi(
                          "tenant",
                          `/reception/${current.id}/no-show`,
                          {
                            method: "POST",
                            body: { facility_id: activeFacilityId },
                          }
                        ),
                      "Marked no-show"
                    )
                  }
                  disabled={isActing}
                >
                  <UserXIcon data-icon="inline-start" />
                  No-show
                </Button>
              </>
            )}
          </div>
        </CardHeader>
      </Card>

      <Dialog open={regOpen} onOpenChange={setRegOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Registration</DialogTitle>
            <DialogDescription>
              Register customer details to generate their service ticket.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleCompleteRegistration}
            className="flex flex-col gap-4"
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="cust_name">Customer Name</FieldLabel>
                <Input
                  id="cust_name"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  required
                  placeholder="Full name"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="cust_phone">Phone (optional)</FieldLabel>
                <Input
                  id="cust_phone"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  placeholder="0812..."
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="cust_email">Email (optional)</FieldLabel>
                <Input
                  id="cust_email"
                  type="email"
                  value={custEmail}
                  onChange={(e) => setCustEmail(e.target.value)}
                  placeholder="customer@example.com"
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="submit" disabled={isActing || !custName}>
                {isActing && <Spinner data-icon="inline-start" />}
                Complete Registration
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="waiting" className="flex flex-col gap-4">
        <TabsList>
          <TabsTrigger value="waiting">
            Waiting ({queue?.waiting_count ?? 0})
          </TabsTrigger>
          <TabsTrigger value="on-hold">
            On Hold ({queue?.on_hold.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="acquisitions">
            Acquisitions ({pendingAcquisitions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="waiting">
          {!queue || queue.waiting.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UsersIcon />
                </EmptyMedia>
                <EmptyTitle>No tickets waiting</EmptyTitle>
                <EmptyDescription>
                  Create a walk-in intake or wait for kiosk check-ins.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Queue #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Step</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queue.waiting.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-base font-medium">
                        {t.queue_number}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {t.queue_session?.customer?.name ?? "Walk-in"}
                        </div>
                        {t.queue_session?.customer?.phone && (
                          <div className="text-xs text-muted-foreground">
                            {t.queue_session.customer.phone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            t.priority >= 3 ? "destructive" : "secondary"
                          }
                        >
                          P{t.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {t.workflow_step?.name ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="on-hold">
          {!queue || queue.on_hold.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <PauseCircleIcon />
                </EmptyMedia>
                <EmptyTitle>No tickets on hold</EmptyTitle>
                <EmptyDescription>
                  Skipped or held reception tickets appear here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Queue #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Called At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queue.on_hold.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono font-medium">
                        {t.queue_number}
                      </TableCell>
                      <TableCell>
                        {t.queue_session?.customer?.name ?? "Walk-in"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {t.called_at
                          ? new Date(t.called_at).toLocaleTimeString()
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            void runAction(
                              () =>
                                browserApi(
                                  "tenant",
                                  `/reception/${t.id}/recall`,
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
                          Recall
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="acquisitions">
          {pendingAcquisitions.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UserPlusIcon />
                </EmptyMedia>
                <EmptyTitle>No acquisitions</EmptyTitle>
                <EmptyDescription>
                  Walk-in and online intakes appear here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingAcquisitions.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono">#{a.id}</TableCell>
                      <TableCell>
                        {a.queue_session?.customer?.name ?? "Unregistered"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{a.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">P{a.priority}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {a.status !== "COMPLETED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setRegAcquisitionId(a.id)
                              setRegOpen(true)
                            }}
                          >
                            <UserPlusIcon data-icon="inline-start" />
                            Register Customer
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
