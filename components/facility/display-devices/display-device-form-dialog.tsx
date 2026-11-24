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
import { createDisplayDevice } from "@/lib/api/admin"

export function DisplayDeviceFormDialog({
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

  useEffect(() => {
    if (!open) return

    setName("")
    setExpiresAt("")
    setPairingCode(null)
    setError(null)
    setSubmitting(false)
  }, [open])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setSubmitting(true)
    setError(null)

    try {
      const response = await createDisplayDevice({
        name: name.trim(),
        expires_at: expiresAt || undefined,
      })

      setPairingCode(response.data.pairing_code)
      toast.success("Layar display terdaftar.")
      onSaved()
    } catch (cause) {
      const validation = getApiValidationErrors(cause)

      if (validation.name) {
        setError(validation.name[0])
      } else {
        setError(getApiErrorMessage(cause, "Gagal mendaftarkan layar display."))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Daftarkan Layar Display</DialogTitle>
          <DialogDescription>
            Kode pairing ditampilkan sekali. Masukkan kode tersebut di layar
            display untuk memasangkan.
          </DialogDescription>
        </DialogHeader>

        {pairingCode ? (
          <div className="space-y-4">
            <Alert>
              <AlertTitle>Kode pairing</AlertTitle>
              <AlertDescription>
                <p className="mt-2 rounded-lg bg-muted px-4 py-3 text-center font-mono text-2xl tracking-[0.3em]">
                  {pairingCode}
                </p>
                <p className="mt-2 text-xs">
                  Masukkan kode ini di layar display. Berlaku 30 menit dan hanya
                  bisa dipakai sekali.
                </p>
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button type="button" onClick={() => onOpenChange(false)}>
                Selesai
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">Nama Layar</Label>
              <Input
                id="display-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Display Ruang Tunggu"
                maxLength={255}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="display-expires">Kedaluwarsa (opsional)</Label>
              <Input
                id="display-expires"
                type="date"
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
              />
            </div>

            {error && (
              <Alert variant="destructive">
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
              <Button type="submit" disabled={submitting || !name.trim()}>
                {submitting ? <Spinner /> : null}
                Daftarkan
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
