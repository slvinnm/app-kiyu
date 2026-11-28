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
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
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
import { browserApi } from "@/lib/api/browser-client"
import { AlertCircleIcon, ArrowLeftIcon, Trash2Icon } from "lucide-react"

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

const ROLES = [
  { label: "Facility Admin", value: "facility_admin" },
  { label: "Operator", value: "operator" },
  { label: "Staff", value: "staff" },
]

export default function TeamUserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const toast = useToastManager()
  const userId = Number(params.userId)

  const [user, setUser] = useState<TeamUser | null>(null)
  const [facilities, setFacilities] = useState<FacilitySummary[]>([])
  const [assignedFacilityIds, setAssignedFacilityIds] = useState<number[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "staff",
    password: "",
  })

  const fetchUser = async () => {
    const [u, f, assignments] = await Promise.all([
      browserApi<TeamUser>("app", `/users/${userId}`),
      browserApi<FacilitySummary[]>("app", "/facilities"),
      browserApi<Array<{ facility_id: number }>>(
        "app",
        `/users/${userId}/facilities`
      ),
    ])
    return { u, f, assignments }
  }

  const applyUser = (res: {
    u: TeamUser
    f: FacilitySummary[]
    assignments: Array<{ facility_id: number }>
  }) => {
    setUser(res.u)
    setFacilities(res.f)
    setAssignedFacilityIds(res.assignments.map((a) => a.facility_id))
    setFormData({
      name: res.u.name,
      email: res.u.email,
      role: res.u.role,
      password: "",
    })
  }

  useEffect(() => {
    let cancelled = false
    fetchUser()
      .then((res) => {
        if (!cancelled) applyUser(res)
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load user")
      })
      .finally(() => {
        if (!cancelled) setIsFetching(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsSaving(true)
    try {
      await browserApi("app", `/users/${userId}`, {
        method: "PUT",
        body: {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          ...(formData.password ? { password: formData.password } : {}),
          facility_ids: assignedFacilityIds,
        },
      })
      toast.add({ title: "User updated", type: "success" })
      router.push("/team")
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update user"
      setError(msg)
      toast.add({ title: "Update failed", description: msg, type: "error" })
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleFacility(facilityId: number) {
    setError("")
    try {
      if (assignedFacilityIds.includes(facilityId)) {
        await browserApi("app", `/users/${userId}/facilities/${facilityId}`, {
          method: "DELETE",
        })
        setAssignedFacilityIds((prev) => prev.filter((id) => id !== facilityId))
      } else {
        await browserApi("app", `/users/${userId}/facilities`, {
          method: "POST",
          body: { facility_id: facilityId },
        })
        setAssignedFacilityIds((prev) => [...prev, facilityId])
      }
      toast.add({ title: "Facility assignment updated", type: "success" })
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to update assignment"
      setError(msg)
      toast.add({ title: "Error", description: msg, type: "error" })
    }
  }

  async function handleDelete() {
    setError("")
    try {
      await browserApi("app", `/users/${userId}`, { method: "DELETE" })
      toast.add({ title: "User deleted", type: "success" })
      router.push("/team")
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete user"
      setError(msg)
      toast.add({ title: "Delete failed", description: msg, type: "error" })
    }
  }

  if (isFetching) {
    return (
      <div className="flex max-w-2xl flex-col gap-6">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{error || "User not found"}</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          render={<Link href="/team" />}
          nativeButton={false}
        >
          Back to Team
        </Button>
      </div>
    )
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            render={<Link href="/team" />}
            nativeButton={false}
            aria-label="Back to team"
          >
            <ArrowLeftIcon />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        {user.role !== "tenant_admin" && (
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                />
              }
            >
              <Trash2Icon data-icon="inline-start" />
              Delete
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete user?</AlertDialogTitle>
                <AlertDialogDescription>
                  {user.name} will lose access to this organization permanently.
                  This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => void handleDelete()}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
          <CardDescription>Update account information and role</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="role">Role</FieldLabel>
                <Select
                  items={ROLES}
                  value={formData.role}
                  onValueChange={(v) =>
                    setFormData({ ...formData, role: v ?? "staff" })
                  }
                >
                  <SelectTrigger id="role" className="w-full">
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
                <FieldLabel htmlFor="password">New Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Leave blank to keep current password"
                />
                <FieldDescription>
                  Minimum 8 characters. Only set to change the password.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel>Facility Assignments</FieldLabel>
                <FieldDescription>
                  Facility-scoped roles need at least one facility. Tenant
                  admins have implicit access.
                </FieldDescription>
                <div className="flex flex-col gap-2 rounded-md border p-3">
                  {facilities.map((f) => (
                    <label
                      key={f.id}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={assignedFacilityIds.includes(f.id)}
                        onCheckedChange={() => void toggleFacility(f.id)}
                      />
                      <span>
                        {f.name}{" "}
                        <span className="font-mono text-xs text-muted-foreground">
                          ({f.code})
                        </span>
                      </span>
                    </label>
                  ))}
                  {facilities.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No facilities available.
                    </p>
                  )}
                </div>
              </Field>
              {user.station && (
                <Field>
                  <FieldLabel>Assigned Station</FieldLabel>
                  <div>
                    <Badge variant="outline">
                      {user.station.name} ({user.station.code})
                    </Badge>
                  </div>
                </Field>
              )}
            </FieldGroup>
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button
                variant="outline"
                render={<Link href="/team" />}
                nativeButton={false}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Spinner data-icon="inline-start" />}
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
