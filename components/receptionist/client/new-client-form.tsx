"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import type { PatientInput } from "@/types/reception"

export function NewPatientForm({
  value,
  errors,
  onChange,
}: {
  value: PatientInput
  errors?: Record<string, string>
  onChange: (value: Partial<PatientInput>) => void
}) {
  function handleGenderChange(nextValue: string | null) {
    onChange({
      gender: nextValue === "male" || nextValue === "female" ? nextValue : "",
    })
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="patient-name">
          Nama Lengkap <span className="text-destructive">*</span>
        </Label>

        <Input
          id="patient-name"
          value={value.name}
          onChange={(event) => onChange({ name: event.target.value })}
          placeholder="Masukkan nama lengkap pasien"
        />

        {errors?.name && (
          <p className="text-xs text-destructive">{errors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="patient-nik">NIK</Label>

        <Input
          id="patient-nik"
          value={value.nik}
          onChange={(event) => onChange({ nik: event.target.value })}
          placeholder="16 digit NIK"
          inputMode="numeric"
          maxLength={16}
        />

        {errors?.nik && (
          <p className="text-xs text-destructive">{errors.nik}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="patient-phone">No. Telepon</Label>

        <Input
          id="patient-phone"
          value={value.phone}
          onChange={(event) => onChange({ phone: event.target.value })}
          placeholder="08xxxxxxxxxx"
          inputMode="tel"
        />

        {errors?.phone && (
          <p className="text-xs text-destructive">{errors.phone}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="patient-dob">Tanggal Lahir</Label>

        <Input
          id="patient-dob"
          type="date"
          value={value.date_of_birth}
          onChange={(event) => onChange({ date_of_birth: event.target.value })}
        />

        {errors?.date_of_birth && (
          <p className="text-xs text-destructive">{errors.date_of_birth}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Jenis Kelamin</Label>

        <Select value={value.gender} onValueChange={handleGenderChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih jenis kelamin" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="male">Laki-laki</SelectItem>

            <SelectItem value="female">Perempuan</SelectItem>
          </SelectContent>
        </Select>

        {errors?.gender && (
          <p className="text-xs text-destructive">{errors.gender}</p>
        )}
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="patient-email">Email</Label>

        <Input
          id="patient-email"
          type="email"
          value={value.email}
          onChange={(event) => onChange({ email: event.target.value })}
          placeholder="nama@email.com"
        />

        {errors?.email && (
          <p className="text-xs text-destructive">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="patient-address">Alamat</Label>

        <Textarea
          id="patient-address"
          value={value.address}
          onChange={(event) => onChange({ address: event.target.value })}
          placeholder="Masukkan alamat pasien"
          rows={3}
        />

        {errors?.address && (
          <p className="text-xs text-destructive">{errors.address}</p>
        )}
      </div>

      <p className="text-xs text-muted-foreground md:col-span-2">
        Nomor rekam medis (MRN) dibuat otomatis oleh sistem jika dikosongkan.
      </p>
    </div>
  )
}
