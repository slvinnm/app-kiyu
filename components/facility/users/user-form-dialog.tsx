"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"

import { getApiErrorMessage, getApiValidationErrors } from "@/lib/api/error"
import { createUser, updateUser } from "@/lib/api/admin"
import { ASSIGNABLE_ROLE_OPTIONS } from "@/lib/admin/roles"

import type { AdminStation, AdminUser } from "@/types/admin"
import type { Department } from "@/types/reception"

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  departments,
  stations,
  scopedDepartmentId = null,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AdminUser | null
  departments: Department[]
  stations: AdminStation[]
  /** Opened inside a department's detail: the department is already fixed. */
  scopedDepartmentId?: number | null
  onSaved: () => void
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<string>("operator")
  const [departmentId, setDepartmentId] = useState("none")
  const [stationId, setStationId] = useState("none")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) {
      return
    }

    setName(user?.name ?? "")
    setEmail(user?.email ?? "")
    setPassword("")
    setRole(user?.role ?? "operator")
    setDepartmentId(scopedDepartmentId ? String(scopedDepartmentId) : "none")
    setStationId(user?.station_id ? String(user.station_id) : "none")
    setError(null)
    setErrors({})
    setSubmitting(false)
  }, [open, user, scopedDepartmentId])

  // Inside a department only operational roles belong here (PRD §8.3, §8.4).
  const roleOptions =
    scopedDepartmentId !== null
      ? ASSIGNABLE_ROLE_OPTIONS.filter(
          (option) => option.value === "operator" || option.value === "staff"
        )
      : ASSIGNABLE_ROLE_OPTIONS

  // Operators work at INTAKE counters; staff at SERVICE/CASHIER/COUNTER.
  const allowedStationTypesFor = (nextRole: string): string[] | null =>
    nextRole === "operator"
      ? ["INTAKE"]
      : nextRole === "staff"
        ? ["SERVICE", "CASHIER", "COUNTER"]
        : null

  const stationOptions = useMemo(() => {
    const inDepartment =
      departmentId === "none"
        ? stations
        : stations.filter(
            (station) => station.department_id === Number(departmentId)
          )

    const allowed = allowedStationTypesFor(role)

    return allowed === null
      ? inDepartment
      : inDepartment.filter((station) => allowed.includes(String(station.type)))
  }, [stations, departmentId, role])

  // Changing the role can invalidate the chosen station; drop it there, not in
  // an effect, so there is no extra render.
  function handleRoleChange(next: string | null) {
    const nextRole = next ?? "operator"
    setRole(nextRole)

    if (stationId === "none") {
      return
    }

    const allowed = allowedStationTypesFor(nextRole)
    const chosen = stations.find((station) => station.id === Number(stationId))
    const stillValid =
      chosen !== undefined &&
      (allowed === null || allowed.includes(String(chosen.type)))

    if (!stillValid) {
      setStationId("none")
    }
  }

  function handleDepartmentChange(value: string | null) {
    const next = value ?? "none"
    setDepartmentId(next)

    if (next === "none") {
      setStationId("none")
      return
    }

    if (
      stationId !== "none" &&
      !stations.some(
        (station) =>
          station.id === Number(stationId) &&
          station.department_id === Number(next)
      )
    ) {
      setStationId("none")
    }
  }

  function handleStationChange(value: string | null) {
    const next = value ?? "none"
    setStationId(next)

    if (next !== "none" && departmentId === "none") {
      const station = stations.find((item) => item.id === Number(next))

      if (station) {
        setDepartmentId(String(station.department_id))
      }
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submitting) {
      return
    }

    const nextErrors: Record<string, string> = {}

    if (!name.trim()) nextErrors.name = "Nama wajib diisi."
    if (!email.trim()) nextErrors.email = "Email wajib diisi."

    if (!user && !password) {
      nextErrors.password = "Password wajib diisi untuk pengguna baru."
    } else if (password && password.length < 8) {
      nextErrors.password = "Password minimal 8 karakter."
    }

    // Inside a department an operator must be placed at an INTAKE station; the
    // backend enforces this too, this is only a faster message.
    if (
      scopedDepartmentId !== null &&
      role === "operator" &&
      stationId === "none"
    ) {
      nextErrors.station_id = "Operator harus memiliki loket."
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setSubmitting(true)
    setError(null)
    setErrors({})

    const payload = {
      name: name.trim(),
      email: email.trim(),
      role,
      department_id: departmentId === "none" ? null : Number(departmentId),
      station_id: stationId === "none" ? null : Number(stationId),
      ...(password ? { password } : {}),
    }

    try {
      if (user) {
        await updateUser(user.id, payload)
        toast.success("Pengguna berhasil diperbarui.")
      } else {
        await createUser(payload)
        toast.success("Pengguna berhasil dibuat.")
      }

      onOpenChange(false)
      onSaved()
    } catch (cause) {
      const message = getApiErrorMessage(cause, "Gagal menyimpan pengguna.")
      setError(message)
      toast.error(message)

      const validation = getApiValidationErrors(cause)

      if (Object.keys(validation).length > 0) {
        const mapped: Record<string, string> = {}

        for (const [key, messages] of Object.entries(validation)) {
          mapped[key] = messages[0] ?? "Nilai tidak valid."
        }

        setErrors(mapped)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {user ? "Edit Pengguna" : "Tambah Pengguna"}
          </DialogTitle>

          <DialogDescription>
            Kelola akun staff, role, dan penempatan department/station.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="user-name">Nama</Label>

              <Input
                id="user-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={255}
              />

              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>

              <Input
                id="user-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />

              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-password">
              Password {!user && <span className="text-destructive">*</span>}
            </Label>

            <Input
              id="user-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={
                user ? "Kosongkan jika tidak diubah" : "Minimal 8 karakter"
              }
              autoComplete="new-password"
            />

            {errors.password && (
              <p className="text-xs text-destructive">{errors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Role</Label>

            <Select value={role} onValueChange={handleRoleChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {errors.role && (
              <p className="text-xs text-destructive">{errors.role}</p>
            )}
          </div>

          <div
            className={`grid gap-4 ${
              scopedDepartmentId === null ? "sm:grid-cols-2" : "grid-cols-1"
            }`}
          >
            {scopedDepartmentId === null && (
              <div className="space-y-2">
                <Label>Department</Label>

                <Select
                  value={departmentId}
                  onValueChange={handleDepartmentChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="none">Tidak ada</SelectItem>

                    {departments.map((department) => (
                      <SelectItem
                        key={department.id}
                        value={String(department.id)}
                      >
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {errors.department_id && (
                  <p className="text-xs text-destructive">
                    {errors.department_id}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Station</Label>

              <Select value={stationId} onValueChange={handleStationChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="none">Tidak ada</SelectItem>

                  {stationOptions.map((station) => (
                    <SelectItem key={station.id} value={String(station.id)}>
                      {station.name} ({station.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {errors.station_id && (
                <p className="text-xs text-destructive">{errors.station_id}</p>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Gagal menyimpan</AlertTitle>

              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Batal
            </Button>

            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner />
                  Menyimpan...
                </>
              ) : (
                "Simpan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
