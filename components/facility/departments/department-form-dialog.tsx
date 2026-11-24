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
import { createDepartment, updateDepartment } from "@/lib/api/admin"

import type { Department } from "@/types/reception"

export function DepartmentFormDialog({
  open,
  onOpenChange,
  department,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  department: Department | null
  onSaved: () => void
}) {
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [isActive, setIsActive] = useState("1")
  const [displayInKiosk, setDisplayInKiosk] = useState("1")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) {
      return
    }

    setCode(department?.code ?? "")
    setName(department?.name ?? "")
    setIsActive(department?.is_active === false ? "0" : "1")
    setDisplayInKiosk(department?.display_in_kiosk === false ? "0" : "1")
    setError(null)
    setErrors({})
    setSubmitting(false)
  }, [open, department])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submitting) {
      return
    }

    if (!code.trim() || !name.trim()) {
      setErrors({
        ...(code.trim() ? {} : { code: "Kode wajib diisi." }),
        ...(name.trim() ? {} : { name: "Nama wajib diisi." }),
      })
      return
    }

    setSubmitting(true)
    setError(null)
    setErrors({})

    const payload = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      is_active: isActive === "1",
      display_in_kiosk: displayInKiosk === "1",
    }

    try {
      if (department) {
        await updateDepartment(department.id, payload)
        toast.success("Departemen berhasil diperbarui.")
      } else {
        await createDepartment(payload)
        toast.success("Departemen berhasil dibuat.")
      }

      onOpenChange(false)
      onSaved()
    } catch (cause) {
      const message = getApiErrorMessage(cause, "Gagal menyimpan departemen.")
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{department ? "Edit Departemen" : "Tambah Departemen"}</DialogTitle>

          <DialogDescription>
            Departemen adalah unit pelayanan yang memiliki station dan workflow.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="department-code">Kode</Label>

            <Input
              id="department-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Contoh: EYE"
              maxLength={50}
            />

            {errors.code && (
              <p className="text-xs text-destructive">{errors.code}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="department-name">Nama</Label>

            <Input
              id="department-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Contoh: Departemen Mata"
              maxLength={255}
            />

            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
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

          <div className="space-y-2">
            <Label>Tampil di Kiosk</Label>

            <Select
              value={displayInKiosk}
              onValueChange={(v) => setDisplayInKiosk(v ?? "1")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="1">Ya — tampil di mesin anjungan</SelectItem>
                <SelectItem value="0">Tidak — hanya untuk internal</SelectItem>
              </SelectContent>
            </Select>

            <p className="text-xs text-muted-foreground">
              Unit internal seperti gudang, ruang berkas, dan kasir sebaiknya
              tidak ditampilkan di kiosk.
            </p>
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
