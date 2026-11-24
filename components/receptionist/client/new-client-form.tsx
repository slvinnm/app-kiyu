"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import type { CustomerInput } from "@/types/reception"

/**
 * Minimal customer intake.
 *
 * Only what the `customers` table stores: a name plus optional contact details.
 * No national identity number, birth date or gender is collected (PRD §1.2).
 */
export function NewCustomerForm({
  value,
  errors,
  onChange,
}: {
  value: CustomerInput
  errors?: Record<string, string>
  onChange: (value: Partial<CustomerInput>) => void
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="customer-name">
          Nama Lengkap <span className="text-destructive">*</span>
        </Label>

        <Input
          id="customer-name"
          value={value.name}
          onChange={(event) => onChange({ name: event.target.value })}
          placeholder="Nama lengkap pelanggan"
        />

        {errors?.name && (
          <p className="text-xs text-destructive">{errors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="customer-phone">Telepon</Label>

        <Input
          id="customer-phone"
          value={value.phone ?? ""}
          onChange={(event) => onChange({ phone: event.target.value })}
          placeholder="08xxxxxxxxxx"
          inputMode="tel"
        />

        {errors?.phone && (
          <p className="text-xs text-destructive">{errors.phone}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="customer-email">Email</Label>

        <Input
          id="customer-email"
          type="email"
          value={value.email ?? ""}
          onChange={(event) => onChange({ email: event.target.value })}
          placeholder="nama@email.com"
        />

        {errors?.email && (
          <p className="text-xs text-destructive">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="customer-address">Alamat</Label>

        <Textarea
          id="customer-address"
          value={value.address ?? ""}
          onChange={(event) => onChange({ address: event.target.value })}
          placeholder="Alamat pelanggan"
          rows={3}
        />

        {errors?.address && (
          <p className="text-xs text-destructive">{errors.address}</p>
        )}
      </div>
    </div>
  )
}
