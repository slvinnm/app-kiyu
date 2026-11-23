"use client"

import { useState } from "react"
import { MonitorSmartphone } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"

import { KioskClock } from "@/components/kiosk/kiosk-clock"

import { pairKioskDevice } from "@/lib/api/kiosk"
import { saveKioskDevice } from "@/lib/kiosk/device"

import type { KioskPairedDevice } from "@/lib/kiosk/device"

const CODE_LENGTH = 8

/**
 * Shown when this browser has no kiosk credential. The operator types the
 * pairing code an admin generated; the device trades it for a credential and
 * stores it locally.
 */
export function KioskOnboarding({
  onPaired,
}: {
  onPaired: (device: KioskPairedDevice) => void
}) {
  const [code, setCode] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submitting) return

    const normalized = code.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()

    if (normalized.length !== CODE_LENGTH) {
      setError(`Kode pairing harus ${CODE_LENGTH} karakter.`)
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await pairKioskDevice(normalized)
      const paired = {
        credential: response.data.credential,
        device: response.data.device,
      }

      saveKioskDevice(paired)
      onPaired(paired)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Gagal memasangkan perangkat kiosk."
      )
      setCode("")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <MonitorSmartphone className="size-5" />
            </div>

            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                ANJUNGAN
              </p>

              <h1 className="text-xl font-bold tracking-tight">
                Pendaftaran Perangkat
              </h1>
            </div>
          </div>

          <KioskClock />
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">
                Perangkat ini belum terdaftar
              </h2>

              <p className="text-sm text-muted-foreground">
                Masukkan kode pairing 8 karakter yang dibuat admin melalui menu
                Perangkat Kiosk. Kode hanya bisa dipakai sekali.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pairing-code">Kode Pairing</Label>

                <Input
                  id="pairing-code"
                  value={code}
                  onChange={(event) => {
                    setCode(
                      event.target.value
                        .replace(/[^a-zA-Z0-9]/g, "")
                        .toUpperCase()
                        .slice(0, CODE_LENGTH)
                    )
                    setError(null)
                  }}
                  placeholder="A1B2C3D4"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  inputMode="text"
                  className="text-center font-mono text-2xl tracking-[0.35em]"
                  maxLength={CODE_LENGTH}
                  autoFocus
                  disabled={submitting}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Pairing gagal</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={submitting || code.length !== CODE_LENGTH}
              >
                {submitting ? (
                  <>
                    <Spinner />
                    Memasangkan...
                  </>
                ) : (
                  "Daftarkan Perangkat"
                )}
              </Button>
            </form>

            <p className="text-xs text-muted-foreground">
              Kode kedaluwarsa setelah 30 menit. Minta admin membuat kode baru
              bila sudah lewat.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
