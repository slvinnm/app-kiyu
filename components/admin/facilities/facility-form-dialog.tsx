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
import { createFacility } from "@/lib/api/admin"

export function FacilityFormDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    setName("")
    setCode("")
    setAddress("")
    setPhone("")
    setError(null)
    setErrors({})
    setSubmitting(false)
  }, [open])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submitting) return

    if (!name.trim() || !code.trim()) {
      setErrors({
        ...(name.trim() ? {} : { name: "Nama wajib diisi." }),
        ...(code.trim() ? {} : { code: "Kode wajib diisi." }),
      })
      return
    }

    setSubmitting(true)
    setError(null)
    setErrors({})

    try {
      await createFacility({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
      })

      toast.success("Fasilitas berhasil dibuat.")
      onOpenChange(false)
      onSaved()
    } catch (cause) {
      const message = getApiErrorMessage(cause, "Gagal menyimpan fasilitas.")
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
          <DialogTitle>Tambah Fasilitas</DialogTitle>

          <DialogDescription>
            Fasilitas adalah unit fisik yang menaungi poli dan antrian.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="facility-name">Nama</Label>

            <Input
              id="facility-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Contoh: Klinik Cabang Selatan"
              maxLength={255}
            />

            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="facility-code">Kode</Label>

            <Input
              id="facility-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Contoh: SELATAN"
              maxLength={50}
            />

            {errors.code && (
              <p className="text-xs text-destructive">{errors.code}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="facility-address">Alamat</Label>

            <Input
              id="facility-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Alamat lengkap"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="facility-phone">Telepon</Label>

            <Input
              id="facility-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Nomor telepon"
            />
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
