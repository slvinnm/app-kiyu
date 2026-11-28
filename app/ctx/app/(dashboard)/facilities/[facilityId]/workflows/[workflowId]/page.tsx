"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useToastManager } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
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
import { Badge } from "@/components/ui/badge"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { browserApi } from "@/lib/api/browser-client"
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  PlusIcon,
  Trash2Icon,
  ListOrderedIcon,
} from "lucide-react"

interface DepartmentOption {
  id: number
  name: string
  code: string
}

interface StationOption {
  id: number
  name: string
  code: string
  department_name?: string
}

interface WorkflowStep {
  id: number
  workflow_id: number
  station_id: number
  name: string
  sequence: number
  is_active: boolean
  is_optional: boolean
  can_skip: boolean
  station?: { id: number; name: string; code: string }
}

interface Workflow {
  id: number
  facility_id: number
  department_id: number
  name: string
  is_active: boolean
  steps?: WorkflowStep[]
}

export default function EditWorkflowPage() {
  const params = useParams()
  const router = useRouter()
  const toast = useToastManager()
  const facilityId = Number(params.facilityId)
  const workflowId = Number(params.workflowId)

  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [stationOptions, setStationOptions] = useState<StationOption[]>([])
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [steps, setSteps] = useState<WorkflowStep[]>([])

  const [isFetching, setIsFetching] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isAddingStep, setIsAddingStep] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    department_id: "",
    name: "",
    is_active: true,
  })
  const [newStep, setNewStep] = useState({
    station_id: "",
    name: "",
    sequence: 1,
    is_active: true,
    is_optional: false,
    can_skip: false,
  })

  const fetchWorkflow = async () => {
    const [wf, opts, stations] = await Promise.all([
      browserApi<Workflow>("app", `/workflows/${workflowId}`, {
        params: { facility_id: facilityId },
      }),
      browserApi<DepartmentOption[]>("app", "/departments/options", {
        params: { facility_id: facilityId },
      }),
      browserApi<StationOption[]>("app", "/stations/options", {
        params: { facility_id: facilityId },
      }),
    ])
    return { wf, opts, stations }
  }

  const applyWorkflow = (res: {
    wf: Workflow
    opts: DepartmentOption[]
    stations: StationOption[]
  }) => {
    setWorkflow(res.wf)
    setDepartments(res.opts)
    setStationOptions(res.stations)
    setSteps(res.wf.steps ?? [])
    setFormData({
      department_id: String(res.wf.department_id),
      name: res.wf.name,
      is_active: res.wf.is_active,
    })
    setNewStep((prev) => ({
      ...prev,
      sequence: (res.wf.steps?.length ?? 0) + 1,
    }))
  }

  async function reloadWorkflow() {
    try {
      const res = await fetchWorkflow()
      applyWorkflow(res)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load workflow")
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    fetchWorkflow()
      .then((res) => {
        if (!cancelled) applyWorkflow(res)
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load workflow"
          )
      })
      .finally(() => {
        if (!cancelled) setIsFetching(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId, workflowId])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsSaving(true)
    try {
      await browserApi("app", `/workflows/${workflowId}`, {
        method: "PUT",
        body: {
          facility_id: facilityId,
          department_id: Number(formData.department_id),
          name: formData.name,
          is_active: formData.is_active,
        },
      })
      toast.add({ title: "Workflow saved", type: "success" })
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save workflow"
      setError(msg)
      toast.add({ title: "Save failed", description: msg, type: "error" })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleAddStep(e: React.FormEvent) {
    e.preventDefault()
    if (!newStep.station_id) return
    setError("")
    setIsAddingStep(true)
    try {
      await browserApi("app", `/workflows/${workflowId}/steps`, {
        method: "POST",
        body: {
          facility_id: facilityId,
          station_id: Number(newStep.station_id),
          name: newStep.name,
          sequence: newStep.sequence,
          is_active: newStep.is_active,
          is_optional: newStep.is_optional,
          can_skip: newStep.can_skip,
        },
      })
      toast.add({ title: "Step added", type: "success" })
      setNewStep({
        station_id: "",
        name: "",
        sequence: newStep.sequence + 1,
        is_active: true,
        is_optional: false,
        can_skip: false,
      })
      await reloadWorkflow()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add step"
      setError(msg)
      toast.add({ title: "Add step failed", description: msg, type: "error" })
    } finally {
      setIsAddingStep(false)
    }
  }

  async function handleDeleteStep(stepId: number) {
    setError("")
    try {
      await browserApi("app", `/workflow-steps/${stepId}`, {
        method: "DELETE",
        params: { facility_id: facilityId },
      })
      toast.add({ title: "Step deleted", type: "success" })
      await reloadWorkflow()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete step"
      setError(msg)
      toast.add({ title: "Delete failed", description: msg, type: "error" })
    }
  }

  const departmentItems = [
    { label: "Select department", value: "" },
    ...departments.map((d) => ({
      label: `${d.name} (${d.code})`,
      value: String(d.id),
    })),
  ]

  const stationItems = [
    { label: "Select station", value: "" },
    ...stationOptions.map((s) => ({
      label: `${s.name} (${s.code})${s.department_name ? ` — ${s.department_name}` : ""}`,
      value: String(s.id),
    })),
  ]

  if (isFetching) {
    return (
      <div className="flex max-w-3xl flex-col gap-6">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AlertCircleIcon />
            </EmptyMedia>
            <EmptyTitle>Workflow not found</EmptyTitle>
            <EmptyDescription>
              {error || "This workflow cannot be loaded."}
            </EmptyDescription>
          </EmptyHeader>
          <Button
            variant="outline"
            render={<Link href={`/facilities/${facilityId}`} />}
            nativeButton={false}
          >
            Back to Facility
          </Button>
        </Empty>
      </div>
    )
  }

  const sortedSteps = [...steps].sort((a, b) => a.sequence - b.sequence)

  return (
    <div className="flex max-w-3xl flex-col gap-6">
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
          <h1 className="text-2xl font-bold tracking-tight">{workflow.name}</h1>
          <p className="text-sm text-muted-foreground">
            Workflow details and step sequence
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Workflow Details</CardTitle>
          <CardDescription>
            Update the workflow name, department, or active state
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
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
                <FieldLabel htmlFor="name">Workflow Name</FieldLabel>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
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
                    Inactive workflows cannot be assigned to tickets.
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
                Back
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Spinner data-icon="inline-start" />}
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workflow Steps</CardTitle>
          <CardDescription>
            Ordered station sequence for this workflow ({sortedSteps.length}{" "}
            step{sortedSteps.length === 1 ? "" : "s"})
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {sortedSteps.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ListOrderedIcon />
                </EmptyMedia>
                <EmptyTitle>No steps yet</EmptyTitle>
                <EmptyDescription>
                  Add the first step to define the service sequence.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ol className="flex flex-col gap-2">
              {sortedSteps.map((step) => (
                <li
                  key={step.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                    {step.sequence}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{step.name}</span>
                      {step.station && (
                        <span className="text-xs text-muted-foreground">
                          {step.station.code}
                        </span>
                      )}
                      {step.is_optional && (
                        <Badge variant="outline">Optional</Badge>
                      )}
                      {step.can_skip && (
                        <Badge variant="outline">Skippable</Badge>
                      )}
                      {!step.is_active && (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => void handleDeleteStep(step.id)}
                    aria-label="Delete step"
                  >
                    <Trash2Icon />
                  </Button>
                </li>
              ))}
            </ol>
          )}

          <form
            onSubmit={handleAddStep}
            className="flex flex-col gap-3 rounded-lg border border-dashed p-4"
          >
            <p className="text-sm font-medium">Add a step</p>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="step_station">Station</FieldLabel>
                <Select
                  items={stationItems}
                  value={newStep.station_id}
                  onValueChange={(val) =>
                    setNewStep({ ...newStep, station_id: val ?? "" })
                  }
                >
                  <SelectTrigger id="step_station" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {stationItems.map((item) => (
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
              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="step_name">Step Name</FieldLabel>
                  <Input
                    id="step_name"
                    value={newStep.name}
                    onChange={(e) =>
                      setNewStep({ ...newStep, name: e.target.value })
                    }
                    placeholder="e.g. Registration"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="step_seq">Sequence</FieldLabel>
                  <Input
                    id="step_seq"
                    type="number"
                    min={1}
                    value={newStep.sequence}
                    onChange={(e) =>
                      setNewStep({
                        ...newStep,
                        sequence: Number(e.target.value) || 1,
                      })
                    }
                    required
                  />
                </Field>
              </div>
              <div className="flex flex-wrap gap-6">
                <Field orientation="horizontal">
                  <Switch
                    id="step_active"
                    checked={newStep.is_active}
                    onCheckedChange={(c) =>
                      setNewStep({ ...newStep, is_active: c })
                    }
                  />
                  <FieldLabel htmlFor="step_active">Active</FieldLabel>
                </Field>
                <Field orientation="horizontal">
                  <Switch
                    id="step_optional"
                    checked={newStep.is_optional}
                    onCheckedChange={(c) =>
                      setNewStep({ ...newStep, is_optional: c })
                    }
                  />
                  <FieldLabel htmlFor="step_optional">Optional</FieldLabel>
                </Field>
                <Field orientation="horizontal">
                  <Switch
                    id="step_skip"
                    checked={newStep.can_skip}
                    onCheckedChange={(c) =>
                      setNewStep({ ...newStep, can_skip: c })
                    }
                  />
                  <FieldLabel htmlFor="step_skip">Can skip</FieldLabel>
                </Field>
              </div>
            </FieldGroup>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isAddingStep || !newStep.station_id || !newStep.name}
              >
                {isAddingStep && <Spinner data-icon="inline-start" />}
                <PlusIcon data-icon="inline-start" />
                Add Step
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
