"use client"

import { useState } from "react"
import { ArrowRightIcon, CalendarPlusIcon } from "lucide-react"
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

import { OnlineBookingSuccess } from "@/components/client/online-booking-success"

import { getApiErrorMessage } from "@/lib/api/error"
import { createOnlineBooking } from "@/lib/api/clients"

import type { Department } from "@/types/reception"
import type { OnlineBookingResult } from "@/types/client"

export function OnlineBookingForm({
  clientId,
  departments,
}: {
  clientId: number
  departments: Department[]
}) {
  const [departmentId, setDepartmentId] = useState("")
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    crypto.randomUUID()
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<OnlineBookingResult | null>(null)

  function handleDepartmentChange(value: string | null) {
    if (!value) {
      return
    }

    setDepartmentId(value)
    setIdempotencyKey(crypto.randomUUID())
    setError(null)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submitting) {
      return
    }

    if (!departmentId) {
      toast.error("Pilih departemen tujuan terlebih dahulu.")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await createOnlineBooking({
        client_id: clientId,
        department_id: Number(departmentId),
        idempotency_key: idempotencyKey,
      })

      setResult(response.data)
      toast.success(response.message ?? "Booking online berhasil dibuat.")
    } catch (cause) {
      const message = getApiErrorMessage(cause, "Gagal membuat booking online.")

      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    setResult(null)
    setDepartmentId("")
    setIdempotencyKey(crypto.randomUUID())
    setError(null)
  }

  if (result) {
    return (
      <OnlineBookingSuccess
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
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Booking Kunjungan Online</CardTitle>

          <CardDescription>
            Pilih departemen tujuan. Anda dapat check-in di kiosk saat tiba di lokasi.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Departemen / Department</Label>

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
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTitle>Booking gagal dibuat</AlertTitle>

                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={submitting || !departmentId}
            >
              {submitting ? (
                <>
                  <Spinner />
                  Membuat Booking...
                </>
              ) : (
                <>
                  Buat Booking
                  <ArrowRightIcon />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarPlusIcon className="size-5" />
          </div>

          <CardTitle className="mt-3 text-base">
            Check-in dilakukan di kiosk
          </CardTitle>

          <CardDescription>
            Booking online belum membuat nomor antrian reception.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Saat tiba di lokasi, lakukan check-in di kiosk dengan kode booking.
            Setelah check-in, Anda akan masuk antrian reception dan mendapatkan
            nomor antrian.
          </p>

          <p>
            Petugas reception akan memverifikasi data Anda di meja registrasi
            sebelum layanan dimulai.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
