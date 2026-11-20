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

import {
  getApiErrorMessage,
  getApiValidationErrors,
} from "@/lib/api/error"
import { createUser, updateUser } from "@/lib/api/admin"
import {
  STAFF_ROLE_OPTIONS,
  normalizeStaffRole,
} from "@/lib/admin/roles"

import type { AdminStation, AdminUser } from "@/types/admin"
import type { Department } from "@/types/reception"

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  departments,
  stations,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AdminUser | null
  departments: Department[]
  stations: AdminStation[]
  onSaved: () => void
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("receptionist")
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
    setRole(normalizeStaffRole(user?.role ?? "receptionist"))
    setDepartmentId(
      user?.department_id ? String(user.department_id) : "none"
    )
    setStationId(user?.station_id ? String(user.station_id) : "none")
    setError(null)
    setErrors({})
    setSubmitting(false)
  }, [open, user])

  const stationOptions = useMemo(() => {
    if (departmentId === "none") {
      return stations
    }

    return stations.filter(
      (station) => station.department_id === Number(departmentId)
    )
  }, [stations, departmentId])

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
      const station = stations.find(
        (item) => item.id === Number(next)
      )

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
      department_id:
        departmentId === "none" ? null : Number(departmentId),
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
              Password{" "}
              {!user && <span className="text-destructive">*</span>}
            </Label>

            <Input
              id="user-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={
                user
                  ? "Kosongkan jika tidak diubah"
                  : "Minimal 8 karakter"
              }
              autoComplete="new-password"
            />

            {errors.password && (
              <p className="text-xs text-destructive">{errors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Role</Label>

            <Select value={role} onValueChange={(v) => setRole(v ?? "receptionist")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {STAFF_ROLE_OPTIONS.map((option) => (
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

          <div className="grid gap-4 sm:grid-cols-2">
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

            <div className="space-y-2">
              <Label>Station</Label>

              <Select value={stationId} onValueChange={handleStationChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="none">Tidak ada</SelectItem>

                  {stationOptions.map((station) => (
                    <SelectItem
                      key={station.id}
                      value={String(station.id)}
                    >
                      {station.name} ({station.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {errors.station_id && (
                <p className="text-xs text-destructive">
                  {errors.station_id}
                </p>
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
