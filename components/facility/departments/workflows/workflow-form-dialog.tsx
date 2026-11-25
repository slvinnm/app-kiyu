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
import { createWorkflow } from "@/lib/api/admin"

import type { Department } from "@/types/reception"

export function WorkflowFormDialog({
  open,
  onOpenChange,
  departments,
  defaultDepartmentId,
  scopedDepartment = false,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  departments: Department[]
  defaultDepartmentId: number | null
  /** Opened inside a department's detail: the department is already fixed. */
  scopedDepartment?: boolean
  onSaved: () => void
}) {
  const [departmentId, setDepartmentId] = useState("")
  const [name, setName] = useState("")
  const [isActive, setIsActive] = useState("1")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) {
      return
    }

    setDepartmentId(defaultDepartmentId ? String(defaultDepartmentId) : "")
    setName("")
    setIsActive("1")
    setError(null)
    setErrors({})
    setSubmitting(false)
  }, [open, defaultDepartmentId])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submitting) {
      return
    }

    const nextErrors: Record<string, string> = {}

    if (!departmentId) nextErrors.department_id = "Pilih departemen."
    if (!name.trim()) nextErrors.name = "Nama wajib diisi."

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setSubmitting(true)
    setError(null)
    setErrors({})

    try {
      await createWorkflow({
        department_id: Number(departmentId),
        name: name.trim(),
        is_active: isActive === "1",
      })

      toast.success("Workflow berhasil dibuat.")
      onOpenChange(false)
      onSaved()
    } catch (cause) {
      const message = getApiErrorMessage(cause, "Gagal membuat workflow.")
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
          <DialogTitle>Tambah Workflow</DialogTitle>

          <DialogDescription>
            Workflow menentukan urutan pelayanan pada sebuah departemen.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!scopedDepartment && (
            <div className="space-y-2">
              <Label>Departemen</Label>

              <Select
                value={departmentId}
                onValueChange={(value) => setDepartmentId(value ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih departemen" />
                </SelectTrigger>

                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem
                      key={department.id}
                      value={String(department.id)}
                    >
                      {department.name} ({department.code})
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
            <Label htmlFor="workflow-name">Nama Workflow</Label>

            <Input
              id="workflow-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Contoh: Alur Rawat Jalan"
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
              onValueChange={(value) => setIsActive(value ?? "1")}
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
