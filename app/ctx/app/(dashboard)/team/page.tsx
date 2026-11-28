"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useToastManager } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { browserApi } from "@/lib/api/browser-client"
import {
  UsersIcon,
  UserPlusIcon,
  SearchIcon,
  MailIcon,
  Trash2Icon,
} from "lucide-react"
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

interface Paginated<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

interface FacilitySummary {
  id: number
  name: string
  code: string
}

interface TeamUser {
  id: number
  name: string
  email: string
  role: string
  station?: { id: number; name: string; code: string } | null
  facilities?: FacilitySummary[]
}

interface Invitation {
  id: number
  email: string
  role: string
  created_at: string
  revoked_at: string | null
  accepted_at: string | null
}

const ROLES = [
  { label: "Facility Admin", value: "facility_admin" },
  { label: "Operator", value: "operator" },
  { label: "Staff", value: "staff" },
]

export default function TeamPage() {
  const toast = useToastManager()

  const [users, setUsers] = useState<TeamUser[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [facilities, setFacilities] = useState<FacilitySummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("staff")
  const [inviteFacilityIds, setInviteFacilityIds] = useState<number[]>([])
  const [isInviting, setIsInviting] = useState(false)
  const [createdToken, setCreatedToken] = useState<string | null>(null)

  const fetchAll = async () => {
    const [u, i, f] = await Promise.all([
      browserApi<Paginated<TeamUser>>("app", "/users", {
        params: { per_page: 100 },
      }),
      browserApi<Invitation[]>("app", "/invitations"),
      browserApi<FacilitySummary[]>("app", "/facilities"),
    ])
    return { users: u.data, invitations: i, facilities: f }
  }

  async function reload() {
    setError("")
    try {
      const res = await fetchAll()
      setUsers(res.users)
      setInvitations(res.invitations)
      setFacilities(res.facilities)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load team")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    fetchAll()
      .then((res) => {
        if (cancelled) return
        setUsers(res.users)
        setInvitations(res.invitations)
        setFacilities(res.facilities)
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load team")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setCreatedToken(null)
    setIsInviting(true)
    try {
      const res = await browserApi<{ invitation: Invitation; token: string }>(
        "app",
        "/invitations",
        {
          method: "POST",
          body: {
            email: inviteEmail,
            role: inviteRole,
            facility_ids: inviteFacilityIds,
          },
        }
      )
      setCreatedToken(res.token)
      setInviteEmail("")
      setInviteFacilityIds([])
      toast.add({ title: "Invitation created", type: "success" })
      await reload()
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to send invitation"
      setError(msg)
      toast.add({ title: "Invitation failed", description: msg, type: "error" })
    } finally {
      setIsInviting(false)
    }
  }

  async function handleRevoke(id: number) {
    setError("")
    try {
      await browserApi("app", `/invitations/${id}`, { method: "DELETE" })
      toast.add({ title: "Invitation revoked", type: "success" })
      await reload()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to revoke"
      setError(msg)
      toast.add({ title: "Error", description: msg, type: "error" })
    }
  }

  async function handleDeleteUser(id: number) {
    setError("")
    try {
      await browserApi("app", `/users/${id}`, { method: "DELETE" })
      toast.add({ title: "User deleted", type: "success" })
      await reload()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete user"
      setError(msg)
      toast.add({ title: "Delete failed", description: msg, type: "error" })
    }
  }

  function toggleFacility(id: number) {
    setInviteFacilityIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === "all" || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const pendingInvitations = invitations.filter(
    (i) => i.revoked_at === null && i.accepted_at === null
  )

  const roleItems = [
    { label: "All roles", value: "all" },
    ...ROLES.map((r) => ({ label: r.label, value: r.value })),
  ]

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Team &amp; Invitations
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage organization users, roles, and facility assignments
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {createdToken && (
        <Alert>
          <MailIcon />
          <AlertDescription className="flex flex-col gap-1">
            <span className="font-medium">Invitation token (shown once):</span>
            <code className="rounded bg-muted px-2 py-1 font-mono text-xs break-all">
              {createdToken}
            </code>
            <span className="text-xs text-muted-foreground">
              Share the tenant invitation link with this token:
              https://[tenant]/invitation/accept?token={createdToken}
            </span>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="users" className="flex flex-col gap-4">
        <TabsList>
          <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
          <TabsTrigger value="invitations">
            Pending Invitations ({pendingInvitations.length})
          </TabsTrigger>
          <TabsTrigger value="invite">Invite New User</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <InputGroup className="max-w-sm">
              <InputGroupInput
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
            </InputGroup>
            <Select
              items={roleItems}
              value={roleFilter}
              onValueChange={(v) => setRoleFilter(v ?? "all")}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {roleItems.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {filteredUsers.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UsersIcon />
                </EmptyMedia>
                <EmptyTitle>No users found</EmptyTitle>
                <EmptyDescription>
                  {search || roleFilter !== "all"
                    ? "No users match the current filters."
                    : "Invite your first team member."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Facilities</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{u.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(u.facilities ?? []).map((f) => (
                            <Badge key={f.id} variant="outline">
                              {f.code}
                            </Badge>
                          ))}
                          {(u.facilities ?? []).length === 0 && (
                            <span className="text-xs text-muted-foreground">
                              All / none
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            render={<Link href={`/team/${u.id}`} />}
                            nativeButton={false}
                          >
                            Manage
                          </Button>
                          {u.role !== "tenant_admin" && (
                            <AlertDialog>
                              <AlertDialogTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    aria-label="Delete user"
                                  />
                                }
                              >
                                <Trash2Icon />
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete user?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {u.name} will lose access to this
                                    organization permanently.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    variant="destructive"
                                    onClick={() => void handleDeleteUser(u.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="invitations" className="flex flex-col gap-4">
          {pendingInvitations.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MailIcon />
                </EmptyMedia>
                <EmptyTitle>No pending invitations</EmptyTitle>
                <EmptyDescription>
                  Invite a team member to see pending invitations here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvitations.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{inv.role}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(inv.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => void handleRevoke(inv.id)}
                        >
                          Revoke
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="invite">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Invite a Team Member</CardTitle>
              <CardDescription>
                Creates a one-time invitation token. Share the token with the
                invitee to complete account setup on the tenant hostname.
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
                      items={ROLES}
                      value={inviteRole}
                      onValueChange={(v) => setInviteRole(v ?? "staff")}
                    >
                      <SelectTrigger id="invite_role" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {ROLES.map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>Facility Assignments</FieldLabel>
                    <FieldDescription>
                      Facility-scoped roles need at least one facility. Select
                      all that apply.
                    </FieldDescription>
                    <div className="flex flex-col gap-2 rounded-md border p-3">
                      {facilities.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No facilities available.
                        </p>
                      ) : (
                        facilities.map((f) => (
                          <label
                            key={f.id}
                            className="flex cursor-pointer items-center gap-2 text-sm"
                          >
                            <Checkbox
                              checked={inviteFacilityIds.includes(f.id)}
                              onCheckedChange={() => toggleFacility(f.id)}
                            />
                            <span>
                              {f.name}{" "}
                              <span className="font-mono text-xs text-muted-foreground">
                                ({f.code})
                              </span>
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </Field>
                </FieldGroup>
                <Button type="submit" disabled={isInviting}>
                  {isInviting && <Spinner data-icon="inline-start" />}
                  <UserPlusIcon data-icon="inline-start" />
                  Create Invitation
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
