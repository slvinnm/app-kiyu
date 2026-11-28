"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useToastManager } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { browserApi } from "@/lib/api/browser-client"
import { AlertCircleIcon, ArrowLeftIcon } from "lucide-react"

interface DepartmentOption {
  id: number
  name: string
  code: string
}

const STATION_TYPES = [
  { label: "Intake / Registration", value: "INTAKE" },
  { label: "Service Delivery", value: "SERVICE" },
  { label: "Cashier", value: "CASHIER" },
  { label: "General Counter", value: "COUNTER" },
]

export default function NewStationPage() {
  const params = useParams()
  const router = useRouter()
  const toast = useToastManager()
  const facilityId = Number(params.facilityId)

  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    department_id: "",
    name: "",
    code: "",
    type: "SERVICE",
    queue_prefix: "",
    is_active: true,
  })

  useEffect(() => {
    let cancelled = false
    async function loadDepts() {
      try {
        const opts = await browserApi<DepartmentOption[]>(
          "app",
          "/departments/options",
          {
            params: { facility_id: facilityId },
          }
        )
        if (cancelled) return
        setDepartments(opts)
        if (opts.length > 0) {
          setFormData((prev) => ({
            ...prev,
            department_id: String(opts[0].id),
          }))
        }
      } catch (err: unknown) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load departments"
          )
      } finally {
        if (!cancelled) setIsFetching(false)
      }
    }
    void loadDepts()
    return () => {
      cancelled = true
    }
  }, [facilityId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await browserApi("app", "/stations", {
        method: "POST",
        body: {
          facility_id: facilityId,
          department_id: Number(formData.department_id),
          name: formData.name,
          code: formData.code,
          type: formData.type,
          queue_prefix: formData.queue_prefix || undefined,
          is_active: formData.is_active,
        },
      })
      toast.add({ title: "Station created", type: "success" })
      router.push(`/facilities/${facilityId}`)
      router.refresh()
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to create station"
      setError(msg)
      toast.add({ title: "Create failed", description: msg, type: "error" })
    } finally {
      setIsLoading(false)
    }
  }

  const departmentItems = [
    { label: "Select department", value: "" },
    ...departments.map((d) => ({
      label: `${d.name} (${d.code})`,
      value: String(d.id),
    })),
  ]

  if (isFetching) {
    return (
      <div className="flex max-w-2xl flex-col gap-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          render={<Link href={`/facilities/${facilityId}`} />}
          nativeButton={false}
          aria-label="Back"
        >
          <ArrowLeftIcon />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Station</h1>
          <p className="text-sm text-muted-foreground">
            Add a service point (loket) to this facility
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="department_id">Department</FieldLabel>
                <Select
                  items={departmentItems}
                  value={formData.department_id}
                  onValueChange={(val) =>
                    setFormData({ ...formData, department_id: val ?? "" })
                  }
                >
                  <SelectTrigger id="department_id" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {departmentItems.map((item) => (
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
                <FieldLabel htmlFor="name">Station Name</FieldLabel>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  placeholder="Loket 1"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="code">Station Code</FieldLabel>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  required
                  maxLength={50}
                  placeholder="LOKET-1"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="type">Station Type</FieldLabel>
                <Select
                  items={STATION_TYPES}
                  value={formData.type}
                  onValueChange={(val) =>
                    setFormData({ ...formData, type: val ?? "SERVICE" })
                  }
                >
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {STATION_TYPES.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="queue_prefix">
                  Queue Prefix (optional)
                </FieldLabel>
                <Input
                  id="queue_prefix"
                  value={formData.queue_prefix}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      queue_prefix: e.target.value.toUpperCase(),
                    })
                  }
                  maxLength={10}
                  placeholder="A"
                />
                <FieldDescription>
                  Ticket prefix, e.g. A for A-001 (max 10 chars).
                </FieldDescription>
              </Field>
              <Field orientation="horizontal">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(c) =>
                    setFormData({ ...formData, is_active: c })
                  }
                />
                <div className="flex flex-col gap-0.5">
                  <FieldLabel htmlFor="is_active">Active</FieldLabel>
                  <FieldDescription>
                    Inactive stations cannot receive tickets.
                  </FieldDescription>
                </div>
              </Field>
            </FieldGroup>

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                render={<Link href={`/facilities/${facilityId}`} />}
                nativeButton={false}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !formData.department_id}
              >
                {isLoading && <Spinner data-icon="inline-start" />}
                {isLoading ? "Creating..." : "Create Station"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
