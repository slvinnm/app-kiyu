"use client"

import { useState } from "react"
import { ArrowRightIcon, ClipboardPlusIcon } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"

import { ManualIntakeSuccess } from "@/components/operator/registration/manual-intake-success"

import { getApiErrorMessage } from "@/lib/api/error"
import { createManualIntake } from "@/lib/api/reception"

import type {
  Department,
  ManualIntakeResult,
  Priority,
} from "@/types/reception"

export function ManualIntakeForm({
  departments,
  defaultDepartmentId,
  actorEmail,
  loadError = null,
  onRegistered,
}: {
  departments: Department[]
  defaultDepartmentId: number | null
  actorEmail: string
  loadError?: string | null
  /** Called after a successful intake so the queue behind the modal refreshes. */
  onRegistered?: () => void
}) {
  const [departmentId, setDepartmentId] = useState(
    defaultDepartmentId ? String(defaultDepartmentId) : ""
  )
  const [priority, setPriority] = useState<Priority>(1)
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    crypto.randomUUID()
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ManualIntakeResult | null>(null)

  function handleDepartmentChange(nextValue: string | null) {
    if (!nextValue) {
      return
    }

    setDepartmentId(nextValue)
    setIdempotencyKey(crypto.randomUUID())
    setError(null)
  }

  function handlePriorityChange(nextValue: string | null) {
    const parsed = Number(nextValue)

    if (parsed !== 1 && parsed !== 2 && parsed !== 3) {
      return
    }

    setPriority(parsed)
    setIdempotencyKey(crypto.randomUUID())
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submitting) {
      return
    }

    if (!departmentId) {
      toast.error("Pilih departemen terlebih dahulu.")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await createManualIntake({
        department_id: Number(departmentId),
        priority,
        idempotency_key: idempotencyKey,
        registered_by: actorEmail,
      })

      setResult(response.data)
      toast.success(response.message ?? "Intake manual berhasil dibuat.")
      onRegistered?.()
    } catch (cause) {
      const message = getApiErrorMessage(cause, "Gagal membuat intake manual.")

      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    setResult(null)
    setError(null)
    setPriority(1)
    setIdempotencyKey(crypto.randomUUID())
  }

  if (result) {
    return (
      <ManualIntakeSuccess
        result={result}
        department={
          departments.find(
            (department) => String(department.id) === departmentId
          ) ?? null
        }
        onReset={reset}
      />
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Intake Manual</CardTitle>

            <CardDescription>
              Buat kunjungan walk-in dan nomor antrian registrasi.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {loadError && (
              <Alert variant="destructive">
                <AlertTitle>Daftar departemen tidak tersedia</AlertTitle>
                <AlertDescription>{loadError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Departemen</Label>

              <Select
                value={departmentId}
                onValueChange={handleDepartmentChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih departemen tujuan" />
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

              <p className="text-xs text-muted-foreground">
                Pelanggan akan mendapat nomor antrean di meja registrasi departemen yang
                dipilih.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Prioritas</Label>

              <Select
                value={String(priority)}
                onValueChange={handlePriorityChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="1">Normal</SelectItem>

                  <SelectItem value="2">Prioritas</SelectItem>

                  <SelectItem value="3">Darurat</SelectItem>
                </SelectContent>
              </Select>

              <p className="text-xs text-muted-foreground">
                Prioritas menentukan urutan pemanggilan antrian di meja
                registrasi.
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTitle>Intake gagal dibuat</AlertTitle>

                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitting || !departmentId}
            >
              {submitting ? (
                <>
                  <Spinner />
                  Membuat Antrian...
                </>
              ) : (
                <>
                  Buat Antrian
                  <ArrowRightIcon />
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ClipboardPlusIcon className="size-5" />
            </div>

            <CardTitle className="mt-3 text-base">
              Identitas dilengkapi saat registrasi
            </CardTitle>

            <CardDescription>
              Sesuai alur KIYU, intake manual tidak membuat data pelanggan.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Pelanggan mendapat nomor antrean reception terlebih dahulu. Data
              pelanggan dicari atau dibuat saat petugas menyelesaikan registrasi di
              halaman Antrian.
            </p>

            <p>
              Setelah registrasi selesai, sistem otomatis membuat tiket layanan
              berikutnya sesuai workflow departemen.
            </p>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
