"use client"

import { useState } from "react"
import { useAsyncData } from "@/hooks/use-async-data"
import { useToastManager } from "@/components/ui/toast"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  RefreshCwIcon,
  SearchIcon,
  TabletIcon,
} from "lucide-react"

interface KioskDepartment {
  id: number
  name: string
  code: string
}

interface PairStatus {
  paired: boolean
  tenantSlug: string
}

const PRIORITY_ITEMS = [
  { label: "Normal", value: "1" },
  { label: "Priority", value: "2" },
  { label: "Urgent", value: "3" },
]

export default function KioskPage() {
  const toast = useToastManager()
  const [pairingCode, setPairingCode] = useState("")
  const [pairError, setPairError] = useState("")
  const [pairLoading, setPairLoading] = useState(false)
  const [selectedDeptId, setSelectedDeptId] = useState("")
  const [selectedPriority, setSelectedPriority] = useState("1")
  const [intakeLoading, setIntakeLoading] = useState(false)
  const [intakeError, setIntakeError] = useState("")
  const [issuedNumber, setIssuedNumber] = useState<string | null>(null)

  const statusQuery = useAsyncData<PairStatus>(async () => {
    const res = await fetch("/api/session/device/kiosk/status", {
      credentials: "include",
      cache: "no-store",
    })
    return (await res.json()) as PairStatus
  }, [])

  const departmentsQuery = useAsyncData<KioskDepartment[]>(async () => {
    if (!statusQuery.data?.paired) return []
    const res = await fetch("/api/device/kiosk/departments", {
      credentials: "include",
      cache: "no-store",
    })
    if (!res.ok) return []
    const json = (await res.json()) as { data?: KioskDepartment[] }
    return json.data ?? []
  }, [statusQuery.data?.paired])

  const isPaired = statusQuery.data?.paired ?? false
  const departments = departmentsQuery.data ?? []

  async function handlePair(e: React.FormEvent) {
    e.preventDefault()
    setPairError("")
    setPairLoading(true)
    try {
      const res = await fetch("/api/session/device/kiosk/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pairing_code: pairingCode }),
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Pairing failed")
      toast.add({ title: "Device paired", type: "success" })
      setPairingCode("")
      await statusQuery.reload()
    } catch (err: unknown) {
      setPairError(err instanceof Error ? err.message : "Pairing failed")
    } finally {
      setPairLoading(false)
    }
  }

  async function handleIntake(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDeptId) return
    setIntakeError("")
    setIssuedNumber(null)
    setIntakeLoading(true)
    try {
      const res = await fetch("/api/device/kiosk/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department_id: Number(selectedDeptId),
          priority: Number(selectedPriority),
          idempotency_key: crypto.randomUUID(),
        }),
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Intake failed")
      const number =
        data?.data?.ticket?.queue_number ?? data?.data?.queue_number ?? null
      setIssuedNumber(number)
      setSelectedDeptId("")
    } catch (err: unknown) {
      setIntakeError(err instanceof Error ? err.message : "Intake failed")
    } finally {
      setIntakeLoading(false)
    }
  }

  if (statusQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-64 w-full max-w-md rounded-xl" />
      </div>
    )
  }

  if (!isPaired) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <TabletIcon className="mx-auto size-12 text-muted-foreground" />
            <CardTitle className="mt-2">Pair Kiosk Device</CardTitle>
            <CardDescription>
              Enter the pairing code shown in the admin dashboard to activate
              this kiosk.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pairError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircleIcon />
                <AlertDescription>{pairError}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handlePair} className="flex flex-col gap-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="pairing_code">Pairing Code</FieldLabel>
                  <Input
                    id="pairing_code"
                    value={pairingCode}
                    onChange={(e) =>
                      setPairingCode(e.target.value.toUpperCase())
                    }
                    required
                    maxLength={8}
                    placeholder="ABC12345"
                    autoComplete="off"
                    className="text-center font-mono text-2xl tracking-widest"
                  />
                </Field>
              </FieldGroup>
              <Button type="submit" size="lg" disabled={pairLoading}>
                {pairLoading && <Spinner data-icon="inline-start" />}
                {pairLoading ? "Pairing..." : "Pair Device"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <TabletIcon className="size-6" />
            <span className="text-lg font-bold">KIYU Kiosk</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void departmentsQuery.reload()}
            aria-label="Refresh"
          >
            <RefreshCwIcon />
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 p-4">
        {issuedNumber && (
          <Alert className="mb-4">
            <CheckCircle2Icon />
            <AlertDescription className="text-lg">
              Ticket issued:{" "}
              <span className="font-mono text-2xl font-bold">
                {issuedNumber}
              </span>
            </AlertDescription>
          </Alert>
        )}

        {intakeError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircleIcon />
            <AlertDescription>{intakeError}</AlertDescription>
          </Alert>
        )}

        {departments.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchIcon />
              </EmptyMedia>
              <EmptyTitle>No departments available</EmptyTitle>
              <EmptyDescription>
                Configure active departments in the admin dashboard to enable
                kiosk intake.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Walk-in Intake</CardTitle>
              <CardDescription>
                Select the service department to issue a queue ticket
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleIntake} className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="dept_select">Department</FieldLabel>
                    <Select
                      items={[
                        { label: "Select a department", value: "" },
                        ...departments.map((d) => ({
                          label: `${d.name} (${d.code})`,
                          value: String(d.id),
                        })),
                      ]}
                      value={selectedDeptId}
                      onValueChange={(v) => setSelectedDeptId(v ?? "")}
                    >
                      <SelectTrigger id="dept_select" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="">Select a department</SelectItem>
                          {departments.map((d) => (
                            <SelectItem key={d.id} value={String(d.id)}>
                              {d.name} ({d.code})
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="priority_select">Priority</FieldLabel>
                    <Select
                      items={PRIORITY_ITEMS}
                      value={selectedPriority}
                      onValueChange={(v) => setSelectedPriority(v ?? "1")}
                    >
                      <SelectTrigger id="priority_select" className="w-full">
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
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={!selectedDeptId || intakeLoading}
                >
                  {intakeLoading && <Spinner data-icon="inline-start" />}
                  {intakeLoading ? "Issuing Ticket..." : "Issue Queue Ticket"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
