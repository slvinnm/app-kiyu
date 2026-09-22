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

import type { NewPatientData } from "@/types/reception"

type NewPatientFormProps = {
  value: NewPatientData
  onChange: (value: Partial<NewPatientData>) => void
}

export function NewPatientForm({ value, onChange }: NewPatientFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Data Pasien Baru</CardTitle>

        <CardDescription>
          Lengkapi data pasien untuk membuat data pasien baru.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Nama</Label>

            <Input
              id="name"
              value={value.name}
              onChange={(event) => onChange({ name: event.target.value })}
              placeholder="Nama lengkap pasien"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="national-id">NIK</Label>

            <Input
              id="national-id"
              value={value.national_id}
              onChange={(event) =>
                onChange({
                  national_id: event.target.value,
                })
              }
              placeholder="16 digit NIK"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>

            <Input
              id="email"
              type="email"
              value={value.email}
              onChange={(event) => onChange({ email: event.target.value })}
              placeholder="nama@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date-of-birth">Tanggal Lahir</Label>

            <Input
              id="date-of-birth"
              type="date"
              value={value.date_of_birth}
              onChange={(event) =>
                onChange({
                  date_of_birth: event.target.value,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Jenis Kelamin</Label>

            <Select
              value={value.gender}
              onValueChange={(gender) =>
                onChange({
                  gender: gender as "male" | "female",
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih jenis kelamin" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="male">Laki-laki</SelectItem>

                <SelectItem value="female">Perempuan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">No. Telepon</Label>

            <Input
              id="phone"
              value={value.phone}
              onChange={(event) => onChange({ phone: event.target.value })}
              placeholder="08xxxxxxxxxx"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Alamat</Label>

            <Input
              id="address"
              value={value.address}
              onChange={(event) => onChange({ address: event.target.value })}
              placeholder="Alamat lengkap pasien"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
