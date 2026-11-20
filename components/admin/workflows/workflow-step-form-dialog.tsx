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
import { addWorkflowStep, updateWorkflowStep } from "@/lib/api/admin"

import type { AdminStation, WorkflowStep } from "@/types/admin"

function yesNo(value: boolean): string {
  return value ? "1" : "0"
}

export function WorkflowStepFormDialog({
  open,
  onOpenChange,
  workflowId,
  step,
  stations,
  existingSteps,
  nextSequence,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  workflowId: number
  step: WorkflowStep | null
  stations: AdminStation[]
  existingSteps: WorkflowStep[]
  nextSequence: number
  onSaved: () => void
}) {
  const [stationId, setStationId] = useState("")
  const [name, setName] = useState("")
  const [sequence, setSequence] = useState("1")
  const [isActive, setIsActive] = useState("1")
  const [isOptional, setIsOptional] = useState("0")
  const [isRepeatable, setIsRepeatable] = useState("0")
  const [canSkip, setCanSkip] = useState("0")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) {
      return
    }

    setStationId(step ? String(step.station_id) : "")
    setName(step?.name ?? "")
    setSequence(step ? String(step.sequence) : String(nextSequence))
    setIsActive(yesNo(step ? step.is_active : true))
    setIsOptional(yesNo(step ? step.is_optional : false))
    setIsRepeatable(yesNo(step ? step.is_repeatable : false))
    setCanSkip(yesNo(step ? step.can_skip : false))
    setError(null)
    setErrors({})
    setSubmitting(false)
  }, [open, step, nextSequence])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submitting) {
      return
    }

    const nextErrors: Record<string, string> = {}
    const parsedSequence = Number(sequence)

    if (!stationId) nextErrors.station_id = "Pilih station."
    if (!name.trim()) nextErrors.name = "Nama wajib diisi."

    if (!Number.isInteger(parsedSequence) || parsedSequence < 1) {
      nextErrors.sequence = "Sequence harus bilangan bulat minimal 1."
    } else {
      const duplicate = existingSteps.some(
        (existing) =>
          existing.sequence === parsedSequence && existing.id !== step?.id
      )

      if (duplicate) {
        nextErrors.sequence =
          "Sequence ini sudah dipakai langkah lain di workflow."
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setSubmitting(true)
    setError(null)
    setErrors({})

    const payload = {
      station_id: Number(stationId),
      name: name.trim(),
      sequence: parsedSequence,
      is_active: isActive === "1",
      is_optional: isOptional === "1",
      is_repeatable: isRepeatable === "1",
      can_skip: canSkip === "1",
    }

    try {
      if (step) {
        await updateWorkflowStep(step.id, payload)
        toast.success("Langkah workflow diperbarui.")
      } else {
        await addWorkflowStep(workflowId, payload)
        toast.success("Langkah workflow ditambahkan.")
      }

      onOpenChange(false)
      onSaved()
    } catch (cause) {
      const message = getApiErrorMessage(cause, "Gagal menyimpan langkah.")
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
          <DialogTitle>{step ? "Edit Langkah" : "Tambah Langkah"}</DialogTitle>

          <DialogDescription>
            Setiap langkah terhubung ke satu station dan memiliki urutan unik.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Station</Label>

            <Select
              value={stationId}
              onValueChange={(value) => setStationId(value ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih station" />
              </SelectTrigger>

              <SelectContent>
                {stations.map((station) => (
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

          <div className="space-y-2">
            <Label htmlFor="step-name">Nama Langkah</Label>

            <Input
              id="step-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Contoh: Pemeriksaan Dokter"
              maxLength={255}
            />

            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="step-sequence">Sequence</Label>

            <Input
              id="step-sequence"
              value={sequence}
              onChange={(event) => setSequence(event.target.value)}
              inputMode="numeric"
            />

            {errors.sequence && (
              <p className="text-xs text-destructive">{errors.sequence}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
              <Label>Opsional</Label>

              <Select
                value={isOptional}
                onValueChange={(v) => setIsOptional(v ?? "0")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="0">Tidak</SelectItem>
                  <SelectItem value="1">Ya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Dapat Diulang</Label>

              <Select
                value={isRepeatable}
                onValueChange={(v) => setIsRepeatable(v ?? "0")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="0">Tidak</SelectItem>
                  <SelectItem value="1">Ya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Bisa Dilewati</Label>

              <Select
                value={canSkip}
                onValueChange={(v) => setCanSkip(v ?? "0")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="0">Tidak</SelectItem>
                  <SelectItem value="1">Ya</SelectItem>
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
