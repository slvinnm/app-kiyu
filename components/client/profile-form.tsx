"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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

import { getApiErrorMessage, getApiValidationErrors } from "@/lib/api/error"
import {
  createClientProfile,
  updateClientProfile,
  type ClientProfilePayload,
} from "@/lib/api/clients"
import { formatDateInput } from "@/lib/reception/format"

import type { ClientProfile, ClientProfileInput } from "@/types/client"

const emptyProfile: ClientProfileInput = {
  name: "",
  nik: "",
  date_of_birth: "",
  gender: "",
  phone: "",
  email: "",
  address: "",
}

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

export function ClientProfileForm({
  userId,
  profile,
  defaultName = "",
  defaultEmail = "",
  redirectTo,
}: {
  userId: number
  profile: ClientProfile | null
  defaultName?: string
  defaultEmail?: string
  redirectTo?: string
}) {
  const router = useRouter()

  const [form, setForm] = useState<ClientProfileInput>(() =>
    profile
      ? {
          name: profile.name,
          nik: profile.nik ?? "",
          date_of_birth: formatDateInput(profile.date_of_birth),
          gender: normalizeGender(profile.gender),
          phone: profile.phone ?? "",
          email: profile.email ?? "",
          address: profile.address ?? "",
        }
      : {
          ...emptyProfile,
          name: defaultName,
          email: defaultEmail,
        }
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update(patch: Partial<ClientProfileInput>) {
    setForm((current) => ({ ...current, ...patch }))
  }

  function handleGenderChange(value: string | null) {
    update({
      gender: value === "male" || value === "female" ? value : "",
    })
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submitting) {
      return
    }

    if (!form.name.trim()) {
      setErrors({ name: "Nama wajib diisi." })
      toast.error("Nama wajib diisi.")
      return
    }

    setSubmitting(true)
    setErrors({})
    setError(null)

    const payload: ClientProfilePayload = {
      name: form.name.trim(),
    }

    const nik = form.nik.trim()
    if (nik) payload.nik = nik

    if (form.date_of_birth) payload.date_of_birth = form.date_of_birth

    if (form.gender) payload.gender = form.gender

    const phone = form.phone.trim()
    if (phone) payload.phone = phone

    const email = form.email.trim()
    if (email) payload.email = email

    const address = form.address.trim()
    if (address) payload.address = address

    try {
      if (profile) {
        await updateClientProfile(profile.id, payload)
        toast.success("Profil pasien diperbarui.")
      } else {
        await createClientProfile({ ...payload, user_id: userId })
        toast.success("Profil pasien berhasil dibuat.")
      }

      if (redirectTo) {
        router.push(redirectTo)
        router.refresh()

        return
      }

      router.refresh()
    } catch (cause) {
      const message = getApiErrorMessage(cause, "Gagal menyimpan profil.")
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
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {profile ? "Data Profil" : "Lengkapi Profil Pasien"}
          </CardTitle>

          <CardDescription>
            {profile
              ? "Perbarui data identitas dan kontak Anda."
              : "Profil pasien diperlukan untuk booking online dan melihat antrian."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="profile-name">
                  Nama Lengkap <span className="text-destructive">*</span>
                </Label>

                <Input
                  id="profile-name"
                  value={form.name}
                  onChange={(event) => update({ name: event.target.value })}
                  placeholder="Masukkan nama lengkap"
                />

                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-nik">NIK</Label>

                <Input
                  id="profile-nik"
                  value={form.nik}
                  onChange={(event) => update({ nik: event.target.value })}
                  placeholder="16 digit NIK"
                  inputMode="numeric"
                  maxLength={16}
                />

                {errors.nik && (
                  <p className="text-xs text-destructive">{errors.nik}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-phone">No. Telepon</Label>

                <Input
                  id="profile-phone"
                  value={form.phone}
                  onChange={(event) => update({ phone: event.target.value })}
                  placeholder="08xxxxxxxxxx"
                  inputMode="tel"
                />

                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-dob">Tanggal Lahir</Label>

                <Input
                  id="profile-dob"
                  type="date"
                  value={form.date_of_birth}
                  onChange={(event) =>
                    update({ date_of_birth: event.target.value })
                  }
                />

                {errors.date_of_birth && (
                  <p className="text-xs text-destructive">
                    {errors.date_of_birth}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Jenis Kelamin</Label>

                <Select value={form.gender} onValueChange={handleGenderChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih jenis kelamin" />
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

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="profile-email">Email</Label>

                <Input
                  id="profile-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => update({ email: event.target.value })}
                  placeholder="nama@email.com"
                />

                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="profile-address">Alamat</Label>

                <Textarea
                  id="profile-address"
                  value={form.address}
                  onChange={(event) => update({ address: event.target.value })}
                  placeholder="Masukkan alamat"
                  rows={3}
                />

                {errors.address && (
                  <p className="text-xs text-destructive">{errors.address}</p>
                )}
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTitle>Gagal menyimpan profil</AlertTitle>

                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner />
                  Menyimpan...
                </>
              ) : profile ? (
                "Simpan Perubahan"
              ) : (
                "Buat Profil Pasien"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">Informasi</CardTitle>

          <CardDescription>
            Profil ini menghubungkan akun Anda dengan rekam medis.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 text-sm text-muted-foreground">
          {profile?.mrn && (
            <div>
              <p className="text-xs text-muted-foreground">No. Rekam Medis</p>

              <p className="mt-1 font-mono font-semibold text-foreground">
                {profile.mrn}
              </p>
            </div>
          )}

          <p>
            Nomor rekam medis dibuat otomatis oleh sistem. Booking online dan
            antrian memerlukan profil pasien yang terhubung.
          </p>

          <p>
            Jika data Anda sudah terdaftar di klinik, gunakan NIK yang sama agar
            tidak terjadi duplikasi.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

/* Alias kept while older pages are migrated. */
export const PatientProfileForm = ClientProfileForm
