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
import { Textarea } from "@/components/ui/textarea"

import { getApiErrorMessage, getApiValidationErrors } from "@/lib/api/error"
import { createCustomer, updateCustomer } from "@/lib/api/admin"

import type { CustomerInput } from "@/types/reception"
import type { Customer } from "@/types/reception"

/**
 * Customer record form.
 *
 * The API stores exactly four optional attributes beyond the name: phone,
 * email, address and the linked login account. No national identity number,
 * medical record number, birth date or gender exists on the `customers` table,
 * so none is collected here (PRD §1.2, §5.1).
 */
export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: Customer | null
  onSaved: () => void
}) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) {
      return
    }

    setName(customer?.name ?? "")
    setPhone(customer?.phone ?? "")
    setEmail(customer?.email ?? "")
    setAddress(customer?.address ?? "")
    setError(null)
    setErrors({})
    setSubmitting(false)
  }, [open, customer])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submitting) {
      return
    }

    if (!name.trim()) {
      setErrors({ name: "Nama wajib diisi." })
      return
    }

    setSubmitting(true)
    setError(null)
    setErrors({})

    const payload: CustomerInput = { name: name.trim() }

    if (phone.trim()) payload.phone = phone.trim()
    if (email.trim()) payload.email = email.trim()
    if (address.trim()) payload.address = address.trim()

    try {
      if (customer) {
        await updateCustomer(customer.id, payload)
        toast.success("Data pelanggan diperbarui.")
      } else {
        await createCustomer(payload)
        toast.success("Pelanggan berhasil dibuat.")
      }

      onOpenChange(false)
      onSaved()
    } catch (cause) {
      const message = getApiErrorMessage(cause, "Gagal menyimpan pelanggan.")
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
          <DialogTitle>
            {customer ? "Edit Pelanggan" : "Tambah Pelanggan"}
          </DialogTitle>

          <DialogDescription>
            Nama wajib diisi. Telepon, email dan alamat opsional.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer-name">
              Nama Lengkap <span className="text-destructive">*</span>
            </Label>

            <Input
              id="customer-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={255}
            />

            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customer-phone">Telepon</Label>

              <Input
                id="customer-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                maxLength={30}
              />

              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-email">Email</Label>

              <Input
                id="customer-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                maxLength={255}
              />

              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-address">Alamat</Label>

            <Textarea
              id="customer-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              rows={3}
            />

            {errors.address && (
              <p className="text-xs text-destructive">{errors.address}</p>
            )}
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
              {submitting && <Spinner className="size-4" />}
              {customer ? "Simpan" : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
