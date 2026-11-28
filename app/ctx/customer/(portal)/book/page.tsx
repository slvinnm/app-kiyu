"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Spinner } from "@/components/ui/spinner"
import { browserApi } from "@/lib/api/browser-client"
import { ApiException } from "@/lib/api/transport"
import { AlertCircleIcon, Building2Icon, CalendarPlusIcon } from "lucide-react"

interface PublicDepartment {
  id: number
  name: string
  code: string
  facility_id: number
  facility_name?: string
}

interface DepartmentOption {
  id: number
  name: string
  code: string
}

export default function CustomerBookPage() {
  const router = useRouter()
  const toast = useToastManager()
  const [selected, setSelected] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const departmentsQuery = useAsyncData<DepartmentOption[]>(async () => {
    // Public tenant-origin-bound endpoint for kiosk departments; customer
    // booking selects a department and the backend derives the facility.
    try {
      const res = await browserApi<PublicDepartment[]>(
        "tenant",
        "/public/departments/active"
      )
      return res.map((d) => ({ id: d.id, name: d.name, code: d.code }))
    } catch (err: unknown) {
      if (err instanceof ApiException && err.status === 401) {
        throw err
      }
      throw err
    }
  }, [])

  const departments = departmentsQuery.data ?? []

  async function handleBook(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setError("")
    setIsSubmitting(true)
    try {
      await browserApi("customer", "/bookings", {
        method: "POST",
        body: {
          department_id: selected,
          idempotency_key: crypto.randomUUID(),
        },
      })
      toast.add({
        title: "Visit booked",
        description: "Check in at the kiosk on arrival.",
        type: "success",
      })
      router.push("/customer/queue")
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to book visit"
      setError(msg)
      toast.add({ title: "Booking failed", description: msg, type: "error" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Book a Visit</h1>
        <p className="text-sm text-muted-foreground">
          Choose the service you need
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {departmentsQuery.isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      ) : departmentsQuery.error ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{departmentsQuery.error}</AlertDescription>
        </Alert>
      ) : departments.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Building2Icon />
            </EmptyMedia>
            <EmptyTitle>No services available</EmptyTitle>
            <EmptyDescription>
              This organization has no bookable departments right now.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Department</CardTitle>
            <CardDescription>
              Choose the service you want to visit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBook} className="flex flex-col gap-4">
              <FieldGroup>
                <Field>
                  <FieldLabel className="sr-only">Department</FieldLabel>
                  <RadioGroup
                    value={selected ? String(selected) : undefined}
                    onValueChange={(v) => setSelected(Number(v))}
                    className="flex flex-col gap-2"
                  >
                    {departments.map((d) => (
                      <label
                        key={d.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 has-[:checked]:border-primary has-[:checked]:bg-accent"
                      >
                        <RadioGroupItem value={String(d.id)} />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{d.name}</span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {d.code}
                          </span>
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
                </Field>
              </FieldGroup>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !selected}
              >
                {isSubmitting ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <CalendarPlusIcon data-icon="inline-start" />
                )}
                {isSubmitting ? "Booking..." : "Book Visit"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
