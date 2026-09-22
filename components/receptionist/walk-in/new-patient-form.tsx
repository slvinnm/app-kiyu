import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { NewPatientData } from "@/types/reception"

type NewPatientFormProps = {
  value: NewPatientData
  onChange: (value: Partial<NewPatientData>) => void
}

function parseDate(value: string) {
  if (!value) {
    return undefined
  }

  const [year, month, day] = value.split("-").map(Number)

  if (!year || !month || !day) {
    return undefined
  }

  return new Date(year, month - 1, day)
}

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

export function NewPatientForm({ value, onChange }: NewPatientFormProps) {
  const selectedDate = parseDate(value.date_of_birth)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Data Pasien Baru</CardTitle>

        <CardDescription>
          Lengkapi data pasien sebelum membuat kunjungan.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">Identitas</p>

            <p className="text-xs text-muted-foreground">
              Informasi dasar pasien.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Nama</Label>

              <Input
                id="name"
                value={value.name}
                onChange={(event) =>
                  onChange({
                    name: event.target.value,
                  })
                }
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
                inputMode="numeric"
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
              <Label htmlFor="date-of-birth">Tanggal Lahir</Label>

              <div className="relative">
                <Input
                  id="date-of-birth"
                  value={
                    selectedDate
                      ? selectedDate.toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })
                      : ""
                  }
                  placeholder="Pilih tanggal lahir"
                  readOnly
                  className="pr-10"
                />

                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-1/2 right-1 -translate-y-1/2"
                        aria-label="Pilih tanggal lahir"
                      >
                        <CalendarIcon />
                      </Button>
                    }
                  />

                  <PopoverContent
                    className="w-auto overflow-hidden p-0"
                    align="end"
                  >
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      defaultMonth={selectedDate}
                      captionLayout="dropdown"
                      onSelect={(date) => {
                        onChange({
                          date_of_birth: date ? formatDate(date) : "",
                        })
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">Kontak</p>

            <p className="text-xs text-muted-foreground">
              Informasi yang dapat digunakan untuk menghubungi pasien.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">No. Telepon</Label>

              <Input
                id="phone"
                value={value.phone}
                onChange={(event) =>
                  onChange({
                    phone: event.target.value,
                  })
                }
                placeholder="08xxxxxxxxxx"
                inputMode="tel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>

              <Input
                id="email"
                type="email"
                value={value.email}
                onChange={(event) =>
                  onChange({
                    email: event.target.value,
                  })
                }
                placeholder="nama@email.com"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">Alamat</p>

            <p className="text-xs text-muted-foreground">
              Alamat tempat tinggal pasien.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Alamat Lengkap</Label>

            <Textarea
              id="address"
              value={value.address}
              onChange={(event) =>
                onChange({
                  address: event.target.value,
                })
              }
              placeholder="Masukkan alamat lengkap pasien"
              className="min-h-24 resize-y"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
