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
import { Textarea } from "@/components/ui/textarea"

import {
  getApiErrorMessage,
  getApiValidationErrors,
} from "@/lib/api/error"
import { createPatient, updatePatient } from "@/lib/api/admin"
import { formatDateInput } from "@/lib/reception/format"

import type { PatientPayload } from "@/types/admin"
import type { Patient } from "@/types/reception"

function normalizeGender(
  gender: string | null | undefined
): "" | "male" | "female" {
  if (!gender) return ""

  const normalized = gender.toLowerCase()

  if (normalized === "male" || normalized === "m" || normalized === "l") {
    return "male"
  }

  if (normalized === "female" || normalized === "f" || normalized === "p") {
    return "female"
  }

  return ""
}

export function PatientFormDialog({
  open,
  onOpenChange,
  patient,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  patient: Patient | null
  onSaved: () => void
}) {
  const [name, setName] = useState("")
  const [nik, setNik] = useState("")
  const [mrn, setMrn] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [gender, setGender] = useState("")
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

    setName(patient?.name ?? "")
    setNik(patient?.nik ?? "")
    setMrn(patient?.mrn ?? "")
    setDateOfBirth(formatDateInput(patient?.date_of_birth))
    setGender(normalizeGender(patient?.gender))
    setPhone(patient?.phone ?? "")
    setEmail(patient?.email ?? "")
    setAddress(patient?.address ?? "")
    setError(null)
    setErrors({})
    setSubmitting(false)
  }, [open, patient])

  function handleGenderChange(value: string | null) {
    setGender(value === "male" || value === "female" ? value : "")
  }

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

    const payload: PatientPayload = { name: name.trim() }

    if (nik.trim()) payload.nik = nik.trim()
    if (mrn.trim()) payload.mrn = mrn.trim()
    if (dateOfBirth) payload.date_of_birth = dateOfBirth
    if (gender) payload.gender = gender
    if (phone.trim()) payload.phone = phone.trim()
    if (email.trim()) payload.email = email.trim()
    if (address.trim()) payload.address = address.trim()

    try {
      if (patient) {
        await updatePatient(patient.id, payload)
        toast.success("Data pasien diperbarui.")
      } else {
        await createPatient(payload)
        toast.success("Pasien berhasil dibuat.")
      }

      onOpenChange(false)
      onSaved()
    } catch (cause) {
      const message = getApiErrorMessage(cause, "Gagal menyimpan pasien.")
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
            {patient ? "Edit Pasien" : "Tambah Pasien"}
          </DialogTitle>

          <DialogDescription>
            Data identitas pasien. MRN dibuat otomatis jika dikosongkan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patient-name">
              Nama Lengkap <span className="text-destructive">*</span>
            </Label>

            <Input
              id="patient-name"
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
              <Label htmlFor="patient-nik">NIK</Label>

              <Input
                id="patient-nik"
                value={nik}
                onChange={(event) => setNik(event.target.value)}
                maxLength={50}
              />

              {errors.nik && (
                <p className="text-xs text-destructive">{errors.nik}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="patient-mrn">MRN</Label>

              <Input
                id="patient-mrn"
                value={mrn}
                onChange={(event) => setMrn(event.target.value)}
                placeholder="Otomatis jika kosong"
                maxLength={50}
              />

              {errors.mrn && (
                <p className="text-xs text-destructive">{errors.mrn}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="patient-dob">Tanggal Lahir</Label>

              <Input
                id="patient-dob"
                type="date"
                value={dateOfBirth}
                onChange={(event) => setDateOfBirth(event.target.value)}
              />

              {errors.date_of_birth && (
                <p className="text-xs text-destructive">
                  {errors.date_of_birth}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Jenis Kelamin</Label>

              <Select value={gender} onValueChange={handleGenderChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="male">Laki-laki</SelectItem>
                  <SelectItem value="female">Perempuan</SelectItem>
                </SelectContent>
              </Select>

              {errors.gender && (
                <p className="text-xs text-destructive">{errors.gender}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="patient-phone">Telepon</Label>

              <Input
                id="patient-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                maxLength={30}
              />

              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="patient-email">Email</Label>

              <Input
                id="patient-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />

              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="patient-address">Alamat</Label>

            <Textarea
              id="patient-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              rows={2}
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
