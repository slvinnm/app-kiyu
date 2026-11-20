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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"

import { getApiErrorMessage, getApiErrorType } from "@/lib/api/error"
import { createReferral } from "@/lib/api/admin"

import type { AdminVisitDetail } from "@/types/admin"
import type { Department, Priority } from "@/types/reception"

const PRIORITIES = [
  { value: "1", label: "Normal" },
  { value: "2", label: "Prioritas" },
  { value: "3", label: "Darurat" },
]

export function ReferralDialog({
  open,
  onOpenChange,
  visit,
  departments,
  actorEmail,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  visit: AdminVisitDetail
  departments: Department[]
  actorEmail: string
  onCreated: () => void
}) {
  const [targetDepartmentId, setTargetDepartmentId] = useState("")
  const [priority, setPriority] = useState(String(visit.priority ?? 1))
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    setTargetDepartmentId("")
    setPriority(String(visit.priority ?? 1))
    setReason("")
    setError(null)
    setSubmitting(false)
  }, [open, visit.id, visit.priority])

  const targets = useMemo(
    () =>
      departments.filter(
        (department) =>
          department.is_active && department.id !== visit.department_id
      ),
    [departments, visit.department_id]
  )

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submitting) {
      return
    }

    if (!targetDepartmentId) {
      toast.error("Pilih department tujuan referral.")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await createReferral({
        source_visit_id: visit.id,
        target_department_id: Number(targetDepartmentId),
        priority: Number(priority) as Priority,
        reason: reason.trim() || undefined,
        referred_by: actorEmail,
      })

      toast.success(response.message ?? "Referral berhasil dibuat.", {
        description: `Kunjungan tujuan: ${response.data.target_visit.visit_number} · Tiket: ${response.data.target_ticket.queue_number}`,
      })

      onOpenChange(false)
      onCreated()
    } catch (cause) {
      const message = getApiErrorMessage(cause, "Gagal membuat referral.")
      const type = getApiErrorType(cause)

      setError(
        type === "INVALID_WORKFLOW"
          ? `${message} Pastikan poli tujuan memiliki workflow aktif.`
          : message
      )
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buat Referral</DialogTitle>

          <DialogDescription>
            Rujuk {visit.visit_number} ke poli lain. Sistem membuat kunjungan
            dan tiket antrian tujuan secara otomatis.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {targets.length === 0 ? (
            <Alert>
              <AlertTitle>Tidak ada poli tujuan</AlertTitle>

              <AlertDescription>
                Tidak ada poli aktif lain yang dapat dijadikan tujuan referral.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Department Tujuan</Label>

                <Select
                  value={targetDepartmentId}
                  onValueChange={(value) => setTargetDepartmentId(value ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih poli tujuan" />
                  </SelectTrigger>

                  <SelectContent>
                    {targets.map((department) => (
                      <SelectItem
                        key={department.id}
                        value={String(department.id)}
                      >
                        {department.name} ({department.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prioritas</Label>

                <Select
                  value={priority}
                  onValueChange={(value) => setPriority(value ?? "1")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {PRIORITIES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referral-reason">Alasan (opsional)</Label>

                <Textarea
                  id="referral-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Alasan rujukan"
                  rows={3}
                />
              </div>
            </>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Referral gagal dibuat</AlertTitle>

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

            <Button
              type="submit"
              disabled={
                submitting || targets.length === 0 || !targetDepartmentId
              }
            >
              {submitting ? (
                <>
                  <Spinner />
                  Membuat...
                </>
              ) : (
                "Buat Referral"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
