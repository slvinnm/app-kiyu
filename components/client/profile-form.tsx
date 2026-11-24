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
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"

import { getApiErrorMessage, getApiValidationErrors } from "@/lib/api/error"
import {
  createClientProfile,
  updateClientProfile,
  type ClientProfilePayload,
} from "@/lib/api/clients"

import type { ClientProfile, ClientProfileInput } from "@/types/client"

const emptyProfile: ClientProfileInput = {
  name: "",
  phone: "",
  email: "",
  address: "",
}

export function CustomerProfileForm({
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

    const phone = form.phone.trim()
    if (phone) payload.phone = phone

    const email = form.email.trim()
    if (email) payload.email = email

    const address = form.address.trim()
    if (address) payload.address = address

    try {
      if (profile) {
        await updateClientProfile(profile.id, payload)
        toast.success("Profil diperbarui.")
      } else {
        await createClientProfile({ ...payload, user_id: userId })
        toast.success("Profil berhasil dibuat.")
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
            {profile ? "Data Profil" : "Lengkapi Profil"}
          </CardTitle>

          <CardDescription>
            {profile
              ? "Perbarui data kontak Anda."
              : "Profil diperlukan untuk booking online dan melihat antrean."}
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
                <Label htmlFor="profile-phone">Telepon</Label>

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
                "Buat Profil"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">Informasi</CardTitle>

          <CardDescription>
            Profil ini menghubungkan akun Anda dengan data pelanggan.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Booking online dan antrean memerlukan profil yang terhubung dengan
            akun Anda.
          </p>

          <p>
            Jika data Anda sudah terdaftar, gunakan email yang sama agar
            tidak terjadi duplikasi.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

