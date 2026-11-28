"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
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
import { browserApi } from "@/lib/api/browser-client"
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  PlusIcon,
  Trash2Icon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react"

interface FacilityUser {
  id: number
  name: string
  email: string
  role: string
  station?: { id: number; name: string; code: string } | null
}

interface Paginated<T> {
  data: T[]
  current_page: number
  last_page: number
  total: number
}

const INVITE_ROLES = [
  { label: "Facility Admin", value: "facility_admin" },
  { label: "Operator (Reception)", value: "operator" },
  { label: "Staff (Service Workstation)", value: "staff" },
]

export default function FacilityTeamPage() {
  const params = useParams()
  const toast = useToastManager()
  const facilityId = Number(params.facilityId)

  const [assignedUsers, setAssignedUsers] = useState<FacilityUser[]>([])
  const [allUsers, setAllUsers] = useState<FacilityUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("staff")
  const [isInviting, setIsInviting] = useState(false)
  const [createdToken, setCreatedToken] = useState<string | null>(null)

  const [selectedUserId, setSelectedUserId] = useState("")
  const [isAssigning, setIsAssigning] = useState(false)

  const fetchTeam = async () => {
    const [assignedRes, allRes] = await Promise.all([
      browserApi<Paginated<FacilityUser>>("app", "/users", {
        params: { facility_id: facilityId, per_page: 100 },
      }),
      browserApi<Paginated<FacilityUser>>("app", "/users", {
        params: { per_page: 100 },
      }),
    ])
    return { assigned: assignedRes.data, all: allRes.data }
  }

  async function reloadTeam() {
    setError("")
    try {
      const res = await fetchTeam()
      setAssignedUsers(res.assigned)
      setAllUsers(res.all)
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load facility team"
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    fetchTeam()
      .then((res) => {
        if (cancelled) return
        setAssignedUsers(res.assigned)
        setAllUsers(res.all)
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load facility team"
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

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setCreatedToken(null)
    setIsInviting(true)
    try {
      const res = await browserApi<{ invitation: unknown; token: string }>(
        "app",
        "/invitations",
        {
          method: "POST",
          body: {
            email: inviteEmail,
            role: inviteRole,
            facility_ids: [facilityId],
          },
        }
      )
      setCreatedToken(res.token)
      setInviteEmail("")
      toast.add({ title: "Invitation created", type: "success" })
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to send invitation"
      setError(msg)
      toast.add({ title: "Invitation failed", description: msg, type: "error" })
    } finally {
      setIsInviting(false)
    }
  }

  async function handleAssignExisting(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUserId) return
    setError("")
    setIsAssigning(true)
    try {
      await browserApi("app", `/users/${selectedUserId}/facilities`, {
        method: "POST",
        body: { facility_id: facilityId },
      })
      setSelectedUserId("")
      toast.add({ title: "User assigned to facility", type: "success" })
      await reloadTeam()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to assign user"
      setError(msg)
      toast.add({ title: "Assignment failed", description: msg, type: "error" })
    } finally {
      setIsAssigning(false)
    }
  }

  async function handleUnassign(userId: number) {
    setError("")
    try {
      await browserApi("app", `/users/${userId}/facilities/${facilityId}`, {
        method: "DELETE",
      })
      toast.add({ title: "Facility assignment removed", type: "success" })
      await reloadTeam()
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to remove assignment"
      setError(msg)
      toast.add({ title: "Error", description: msg, type: "error" })
    }
  }

  const assignedIds = new Set(assignedUsers.map((u) => u.id))
  const assignableUsers = allUsers.filter(
    (u) =>
      !assignedIds.has(u.id) &&
      u.role !== "tenant_admin" &&
      u.role !== "customer"
  )

  const assignableItems = [
    { label: "Select user to assign", value: "" },
    ...assignableUsers.map((u) => ({
      label: `${u.name} (${u.role})`,
      value: String(u.id),
    })),
  ]

  if (isLoading) {
    return (
      <div className="flex max-w-4xl flex-col gap-6">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
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
            <h1 className="text-2xl font-bold tracking-tight">Facility Team</h1>
            <p className="text-sm text-muted-foreground">
              Manage workforce assignments and invitations for this facility
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          render={<Link href="/team" />}
          nativeButton={false}
        >
          Organization Team
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {createdToken && (
        <Alert>
          <UserPlusIcon />
          <AlertDescription className="flex flex-col gap-1">
            <span>
              Invitation created. Share this one-time token (shown once):
            </span>
            <code className="rounded bg-muted px-2 py-1 font-mono text-xs break-all">
              {createdToken}
            </code>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Assigned Workforce</CardTitle>
          <CardDescription>Users with access to this facility</CardDescription>
        </CardHeader>
        <CardContent>
          {assignedUsers.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UsersIcon />
                </EmptyMedia>
                <EmptyTitle>No users assigned</EmptyTitle>
                <EmptyDescription>
                  Invite a new team member or assign an existing organization
                  user below.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Station</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{user.role}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.station
                        ? `${user.station.name} (${user.station.code})`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              aria-label="Remove assignment"
                            />
                          }
                        >
                          <Trash2Icon />
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Remove facility assignment?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {user.name} will no longer be able to access this
                              facility.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              onClick={() => void handleUnassign(user.id)}
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Invite New User</CardTitle>
            <CardDescription>
              Send a one-time workforce invitation scoped to this facility
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="flex flex-col gap-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="invite_email">Email</FieldLabel>
                  <Input
                    id="invite_email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="staff@organization.com"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="invite_role">Role</FieldLabel>
                  <Select
                    items={INVITE_ROLES}
                    value={inviteRole}
                    onValueChange={(val) => setInviteRole(val ?? "staff")}
                  >
                    <SelectTrigger id="invite_role" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {INVITE_ROLES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
              <Button type="submit" disabled={isInviting}>
                {isInviting && <Spinner data-icon="inline-start" />}
                <UserPlusIcon data-icon="inline-start" />
                Send Invitation
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assign Existing User</CardTitle>
            <CardDescription>
              Grant an existing organization user access to this facility
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleAssignExisting}
              className="flex flex-col gap-4"
            >
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="assign_user">User</FieldLabel>
                  <Select
                    items={assignableItems}
                    value={selectedUserId}
                    onValueChange={(val) => setSelectedUserId(val ?? "")}
                  >
                    <SelectTrigger id="assign_user" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {assignableItems.map((item) => (
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
                  <FieldDescription>
                    Tenant admins already have implicit access to every
                    facility.
                  </FieldDescription>
                </Field>
              </FieldGroup>
              <Button
                type="submit"
                variant="outline"
                disabled={isAssigning || !selectedUserId}
              >
                {isAssigning && <Spinner data-icon="inline-start" />}
                <PlusIcon data-icon="inline-start" />
                Assign to Facility
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
