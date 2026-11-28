"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { browserApi } from "@/lib/api/browser-client"
import {
  PlusIcon,
  Building2Icon,
  LayersIcon,
  UsersIcon,
  SettingsIcon,
  ArrowLeftIcon,
  AlertCircleIcon,
  WorkflowIcon,
} from "lucide-react"

interface Paginated<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

interface Facility {
  id: number
  name: string
  code: string
  address: string | null
  phone: string | null
  timezone: string | null
  is_active: boolean
  departments?: Department[]
}

interface Department {
  id: number
  facility_id: number
  code: string
  name: string
  is_active: boolean
  display_in_kiosk: boolean
  stations?: Station[]
}

interface Station {
  id: number
  facility_id: number
  department_id: number
  name: string
  code: string
  type: string
  queue_prefix: string | null
  is_active: boolean
  department?: { id: number; name: string; code: string }
}

interface Workflow {
  id: number
  facility_id: number
  department_id: number
  name: string
  is_active: boolean
  department?: { id: number; name: string; code: string }
  steps?: Array<{ id: number }>
}

interface TeamUser {
  id: number
  name: string
  email: string
  role: string
  station?: { id: number; name: string; code: string } | null
}

export default function FacilityDetailPage() {
  const params = useParams()
  const facilityId = Number(params.facilityId)

  const [facility, setFacility] = useState<Facility | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [stations, setStations] = useState<Station[]>([])
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchAll = async () => {
    const [f, d, s, w, u] = await Promise.all([
      browserApi<Facility>("app", `/facilities/${facilityId}`),
      browserApi<Paginated<Department>>("app", "/departments", {
        params: { facility_id: facilityId, per_page: 100 },
      }),
      browserApi<Paginated<Station>>("app", "/stations", {
        params: { facility_id: facilityId, per_page: 100 },
      }),
      browserApi<Paginated<Workflow>>("app", "/workflows", {
        params: { facility_id: facilityId, per_page: 100 },
      }),
      browserApi<Paginated<TeamUser>>("app", "/users", {
        params: { facility_id: facilityId, per_page: 100 },
      }),
    ])
    return { f, d: d.data, s: s.data, w: w.data, u: u.data }
  }

  async function retryLoad() {
    setIsLoading(true)
    setError("")
    try {
      const res = await fetchAll()
      setFacility(res.f)
      setDepartments(res.d)
      setStations(res.s)
      setWorkflows(res.w)
      setTeamUsers(res.u)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load facility")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    fetchAll()
      .then((res) => {
        if (cancelled) return
        setFacility(res.f)
        setDepartments(res.d)
        setStations(res.s)
        setWorkflows(res.w)
        setTeamUsers(res.u)
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load facility"
          )
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-5 w-48" />
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  if (error || !facility) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AlertCircleIcon />
            </EmptyMedia>
            <EmptyTitle>Could not load facility</EmptyTitle>
            <EmptyDescription>{error}</EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" onClick={() => void retryLoad()}>
            Retry
          </Button>
        </Empty>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/facilities" />}>
              Facilities
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{facility.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            render={<Link href="/facilities" />}
            nativeButton={false}
            aria-label="Back to facilities"
          >
            <ArrowLeftIcon />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {facility.name}
            </h1>
            <p className="font-mono text-sm text-muted-foreground">
              {facility.code}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={facility.is_active ? "secondary" : "outline"}>
            {facility.is_active ? "Active" : "Inactive"}
          </Badge>
          <Button
            variant="outline"
            render={<Link href={`/facilities/${facilityId}/edit`} />}
            nativeButton={false}
          >
            <SettingsIcon data-icon="inline-start" />
            Edit Facility
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="flex flex-col gap-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="departments">
            Departments ({departments.length})
          </TabsTrigger>
          <TabsTrigger value="stations">
            Stations ({stations.length})
          </TabsTrigger>
          <TabsTrigger value="workflows">
            Workflows ({workflows.length})
          </TabsTrigger>
          <TabsTrigger value="team">Team ({teamUsers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  Departments
                </CardTitle>
                <LayersIcon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{departments.length}</div>
                <p className="text-xs text-muted-foreground">
                  Service categories
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Stations</CardTitle>
                <Building2Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stations.length}</div>
                <p className="text-xs text-muted-foreground">Service points</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Workflows</CardTitle>
                <WorkflowIcon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{workflows.length}</div>
                <p className="text-xs text-muted-foreground">Routing rules</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Team</CardTitle>
                <UsersIcon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teamUsers.length}</div>
                <p className="text-xs text-muted-foreground">
                  Assigned workforce
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Facility Details</CardTitle>
                <CardDescription>Metadata and status</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="flex flex-col gap-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Name</dt>
                    <dd className="font-medium">{facility.name}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Code</dt>
                    <dd className="font-mono">{facility.code}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Timezone</dt>
                    <dd>{facility.timezone ?? "UTC"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Address</dt>
                    <dd className="text-right">{facility.address ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd>{facility.phone ?? "—"}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Setup Shortcuts</CardTitle>
                <CardDescription>
                  Configure this facility step by step
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  render={
                    <Link href={`/facilities/${facilityId}/departments/new`} />
                  }
                  nativeButton={false}
                >
                  <PlusIcon data-icon="inline-start" />
                  Add Department
                </Button>
                <Button
                  variant="outline"
                  render={
                    <Link href={`/facilities/${facilityId}/stations/new`} />
                  }
                  nativeButton={false}
                >
                  <PlusIcon data-icon="inline-start" />
                  Add Station
                </Button>
                <Button
                  variant="outline"
                  render={
                    <Link href={`/facilities/${facilityId}/workflows/new`} />
                  }
                  nativeButton={false}
                >
                  <PlusIcon data-icon="inline-start" />
                  Create Workflow
                </Button>
                <Button
                  variant="outline"
                  render={<Link href={`/facilities/${facilityId}/team`} />}
                  nativeButton={false}
                >
                  <UsersIcon data-icon="inline-start" />
                  Manage Team Assignments
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium">Departments</h2>
              <p className="text-sm text-muted-foreground">
                Service categories in this facility
              </p>
            </div>
            <Button
              render={
                <Link href={`/facilities/${facilityId}/departments/new`} />
              }
              nativeButton={false}
            >
              <PlusIcon data-icon="inline-start" />
              Add Department
            </Button>
          </div>

          {departments.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <LayersIcon />
                </EmptyMedia>
                <EmptyTitle>No departments yet</EmptyTitle>
                <EmptyDescription>
                  Create a department to add stations and workflows.
                </EmptyDescription>
              </EmptyHeader>
              <Button
                render={
                  <Link href={`/facilities/${facilityId}/departments/new`} />
                }
                nativeButton={false}
              >
                <PlusIcon data-icon="inline-start" />
                Create Department
              </Button>
            </Empty>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Kiosk</TableHead>
                    <TableHead>Stations</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono">{d.code}</TableCell>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell>
                        <Badge variant={d.is_active ? "secondary" : "outline"}>
                          {d.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={d.display_in_kiosk ? "secondary" : "outline"}
                        >
                          {d.display_in_kiosk ? "Visible" : "Hidden"}
                        </Badge>
                      </TableCell>
                      <TableCell>{d.stations?.length ?? 0}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          render={
                            <Link
                              href={`/facilities/${facilityId}/departments/${d.id}`}
                            />
                          }
                          nativeButton={false}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="stations" className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium">Stations</h2>
              <p className="text-sm text-muted-foreground">
                Service points (loket) assigned to departments
              </p>
            </div>
            <Button
              render={<Link href={`/facilities/${facilityId}/stations/new`} />}
              nativeButton={false}
            >
              <PlusIcon data-icon="inline-start" />
              Add Station
            </Button>
          </div>

          {stations.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Building2Icon />
                </EmptyMedia>
                <EmptyTitle>No stations yet</EmptyTitle>
                <EmptyDescription>
                  Create stations so staff can call and serve tickets.
                </EmptyDescription>
              </EmptyHeader>
              <Button
                render={
                  <Link href={`/facilities/${facilityId}/stations/new`} />
                }
                nativeButton={false}
              >
                <PlusIcon data-icon="inline-start" />
                Create Station
              </Button>
            </Empty>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Prefix</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stations.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="font-mono">{s.code}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.department?.name ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{s.type}</Badge>
                      </TableCell>
                      <TableCell className="font-mono">
                        {s.queue_prefix ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.is_active ? "secondary" : "outline"}>
                          {s.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          render={
                            <Link
                              href={`/facilities/${facilityId}/stations/${s.id}`}
                            />
                          }
                          nativeButton={false}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="workflows" className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium">Workflows</h2>
              <p className="text-sm text-muted-foreground">
                Ordered station sequences per department
              </p>
            </div>
            <Button
              render={<Link href={`/facilities/${facilityId}/workflows/new`} />}
              nativeButton={false}
            >
              <PlusIcon data-icon="inline-start" />
              Create Workflow
            </Button>
          </div>

          {workflows.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <WorkflowIcon />
                </EmptyMedia>
                <EmptyTitle>No workflows yet</EmptyTitle>
                <EmptyDescription>
                  Define ordered steps for tickets in a department.
                </EmptyDescription>
              </EmptyHeader>
              <Button
                render={
                  <Link href={`/facilities/${facilityId}/workflows/new`} />
                }
                nativeButton={false}
              >
                <PlusIcon data-icon="inline-start" />
                Create Workflow
              </Button>
            </Empty>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Steps</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workflows.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-medium">{w.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {w.department?.name ?? "—"}
                      </TableCell>
                      <TableCell>{w.steps?.length ?? 0}</TableCell>
                      <TableCell>
                        <Badge variant={w.is_active ? "secondary" : "outline"}>
                          {w.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          render={
                            <Link
                              href={`/facilities/${facilityId}/workflows/${w.id}`}
                            />
                          }
                          nativeButton={false}
                        >
                          Manage Steps
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="team" className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium">Assigned Team</h2>
              <p className="text-sm text-muted-foreground">
                Workforce members with access to {facility.name}
              </p>
            </div>
            <Button
              render={<Link href={`/facilities/${facilityId}/team`} />}
              nativeButton={false}
            >
              <UsersIcon data-icon="inline-start" />
              Manage Team &amp; Invitations
            </Button>
          </div>

          {teamUsers.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UsersIcon />
                </EmptyMedia>
                <EmptyTitle>No team assigned yet</EmptyTitle>
                <EmptyDescription>
                  Invite staff or assign existing organization users to this
                  facility.
                </EmptyDescription>
              </EmptyHeader>
              <Button
                render={<Link href={`/facilities/${facilityId}/team`} />}
                nativeButton={false}
              >
                <PlusIcon data-icon="inline-start" />
                Invite or Assign User
              </Button>
            </Empty>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Station</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{u.role}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.station
                          ? `${u.station.name} (${u.station.code})`
                          : "—"}
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
