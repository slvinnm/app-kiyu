"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MonitorSmartphone } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"

import { KioskClock } from "@/components/kiosk/kiosk-clock"

import { pairDevice } from "@/lib/device/client"

const CODE_LENGTH = 8

/**
 * Shown when this browser has no kiosk credential. The operator types the
 * pairing code an admin generated; the server trades it for a credential and
 * stores it in an HttpOnly cookie. On success the page reloads as a paired
 * kiosk.
 */
export function KioskOnboarding() {
  const router = useRouter()

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
      await pairDevice("kiosk", normalized)
      router.refresh()
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Gagal memasangkan perangkat kiosk."
      )
      setCode("")
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-6 md:px-10 md:py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <MonitorSmartphone className="size-6" />
            </div>

            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                ANJUNGAN
              </p>
              <h1 className="text-2xl font-bold tracking-tight">
                Pendaftaran Perangkat
              </h1>
            </div>
          </div>

          <KioskClock />
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8">
            <h2 className="text-xl font-semibold">
              Perangkat ini belum terdaftar
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Masukkan kode pairing 8 karakter yang dibuat admin di menu
              Perangkat Kiosk. Kode hanya bisa dipakai sekali.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
                  autoFocus
                  disabled={submitting}
                  className="text-center font-mono text-2xl tracking-[0.35em]"
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

            <p className="mt-4 text-xs text-muted-foreground">
              Kode kedaluwarsa setelah 30 menit. Minta admin membuat kode baru
              bila sudah lewat.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
