"use client"

import { useEffect, useState } from "react"
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
import { createStation, updateStation } from "@/lib/api/admin"
import { stationTypeLabel } from "@/lib/reception/format"

import type { AdminStation } from "@/types/admin"
import type { Department } from "@/types/reception"

const STATION_TYPES = [
  "REGISTRATION",
  "NURSE",
  "DOCTOR",
  "LABORATORY",
  "PHARMACY",
  "BILLING",
]

export function StationFormDialog({
  open,
  onOpenChange,
  station,
  departments,
  defaultDepartmentId,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  station: AdminStation | null
  departments: Department[]
  defaultDepartmentId?: number | null
  onSaved: () => void
}) {
  const [departmentId, setDepartmentId] = useState("")
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [type, setType] = useState("REGISTRATION")
  const [queuePrefix, setQueuePrefix] = useState("")
  const [isActive, setIsActive] = useState("1")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) {
      return
    }

    setDepartmentId(
      station?.department_id
        ? String(station.department_id)
        : defaultDepartmentId
          ? String(defaultDepartmentId)
          : ""
    )
    setName(station?.name ?? "")
    setCode(station?.code ?? "")
    setType(station?.type ?? "REGISTRATION")
    setQueuePrefix(station?.queue_prefix ?? "")
    setIsActive(station?.is_active === false ? "0" : "1")
    setError(null)
    setErrors({})
    setSubmitting(false)
  }, [open, station, defaultDepartmentId])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submitting) {
      return
    }

    const nextErrors: Record<string, string> = {}

    if (!departmentId) nextErrors.department_id = "Pilih poli."
    if (!name.trim()) nextErrors.name = "Nama wajib diisi."
    if (!code.trim()) nextErrors.code = "Kode wajib diisi."

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setSubmitting(true)
    setError(null)
    setErrors({})

    const payload = {
      department_id: Number(departmentId),
      name: name.trim(),
      code: code.trim().toUpperCase(),
      type,
      queue_prefix: queuePrefix.trim() || undefined,
      is_active: isActive === "1",
    }

    try {
      if (station) {
        await updateStation(station.id, payload)
        toast.success("Station berhasil diperbarui.")
      } else {
        await createStation(payload)
        toast.success("Station berhasil dibuat.")
      }

      onOpenChange(false)
      onSaved()
    } catch (cause) {
      const message = getApiErrorMessage(cause, "Gagal menyimpan station.")
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
            {station ? "Edit Station" : "Tambah Station"}
          </DialogTitle>

          <DialogDescription>
            Station adalah titik pelayanan fisik/logis di dalam poli.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Poli</Label>

            <Select
              value={departmentId}
              onValueChange={(value) => setDepartmentId(value ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih poli" />
              </SelectTrigger>

              <SelectContent>
                {departments.map((department) => (
                  <SelectItem key={department.id} value={String(department.id)}>
                    {department.name} ({department.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {errors.department_id && (
              <p className="text-xs text-destructive">{errors.department_id}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="station-code">Kode</Label>

              <Input
                id="station-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="Contoh: GEN-REG"
                maxLength={50}
              />

              {errors.code && (
                <p className="text-xs text-destructive">{errors.code}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="station-prefix">Prefix Antrian</Label>

              <Input
                id="station-prefix"
                value={queuePrefix}
                onChange={(event) => setQueuePrefix(event.target.value)}
                placeholder="Contoh: R"
                maxLength={10}
              />

              {errors.queue_prefix && (
                <p className="text-xs text-destructive">
                  {errors.queue_prefix}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="station-name">Nama</Label>

            <Input
              id="station-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Contoh: Loket Registrasi"
              maxLength={255}
            />

            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipe</Label>

              <Select
                value={type}
                onValueChange={(v) => setType(v ?? "REGISTRATION")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {STATION_TYPES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {stationTypeLabel(value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {errors.type && (
                <p className="text-xs text-destructive">{errors.type}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>

              <Select
                value={isActive}
                onValueChange={(v) => setIsActive(v ?? "1")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="1">Aktif</SelectItem>
                  <SelectItem value="0">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
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
