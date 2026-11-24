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
import { Spinner } from "@/components/ui/spinner"

import { getApiErrorMessage, getApiValidationErrors } from "@/lib/api/error"
import { createKioskDevice } from "@/lib/api/admin"

export function KioskDeviceFormDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const [name, setName] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    setName("")
    setExpiresAt("")
    setPairingCode(null)
    setError(null)
    setErrors({})
    setSubmitting(false)
  }, [open])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submitting) return

    if (!name.trim()) {
      setErrors({ name: "Nama wajib diisi." })
      return
    }

    setSubmitting(true)
    setError(null)
    setErrors({})

    try {
      const response = await createKioskDevice({
        name: name.trim(),
        expires_at: expiresAt || undefined,
      })

      setPairingCode(response.data.pairing_code)
      toast.success("Perangkat kiosk terdaftar.")
      onSaved()
    } catch (cause) {
      const message = getApiErrorMessage(cause, "Gagal mendaftarkan kiosk.")
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
          <DialogTitle>Daftarkan Kiosk</DialogTitle>

          <DialogDescription>
            Kode pairing hanya ditampilkan sekali setelah perangkat dibuat.
          </DialogDescription>
        </DialogHeader>

        {pairingCode ? (
          <div className="space-y-4">
            <Alert>
              <AlertTitle>Masukkan kode ini di perangkat kiosk</AlertTitle>

              <AlertDescription>
                <code className="mt-2 block rounded-md bg-muted p-3 text-center font-mono text-2xl tracking-[0.35em]">
                  {pairingCode}
                </code>

                <span className="mt-2 block text-xs">
                  Berlaku 30 menit dan hanya bisa dipakai sekali. Kode hilang?
                  Buat ulang dari daftar perangkat.
                </span>
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button
                type="button"
                onClick={() => {
                  setPairingCode(null)
                  onOpenChange(false)
                }}
              >
                Selesai
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="kiosk-name">Nama Perangkat</Label>

              <Input
                id="kiosk-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Contoh: Kiosk Lobby"
                maxLength={255}
              />

              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="kiosk-expires">Kedaluwarsa (opsional)</Label>

              <Input
                id="kiosk-expires"
                type="date"
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
              />

              {errors.expires_at && (
                <p className="text-xs text-destructive">{errors.expires_at}</p>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTitle>Gagal mendaftarkan</AlertTitle>

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
                    Mendaftarkan...
                  </>
                ) : (
                  "Daftarkan"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
