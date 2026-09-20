"use client"

import { useState } from "react"
import {
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClipboardCheckIcon,
  IdCardIcon,
  PhoneIcon,
  SearchIcon,
  ScanLineIcon,
  UserRoundIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
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
import { Separator } from "@/components/ui/separator"

type Patient = {
  medicalRecordNumber: string
  name: string
  phone: string
  nik: string
  birthDate: string
  gender: string
}

type QueueAcquisition = {
  code: string
  queueNumber: string
  department: string
  visitNumber: string
  status: "ACQUIRED" | "EXPIRED" | "COMPLETED"
}

const patients: Patient[] = [
  {
    medicalRecordNumber: "RM-000123",
    name: "Budi Santoso",
    phone: "081234567890",
    nik: "3573010101900001",
    birthDate: "1 Januari 1990",
    gender: "Laki-laki",
  },
  {
    medicalRecordNumber: "RM-000124",
    name: "Siti Aminah",
    phone: "082112345678",
    nik: "3573010202910002",
    birthDate: "2 Februari 1991",
    gender: "Perempuan",
  },
]

export function RegistrationKiosk() {
  const [kioskCode, setKioskCode] = useState("")
  const [acquisition, setAcquisition] = useState<QueueAcquisition | null>(null)

  const [search, setSearch] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  const [completed, setCompleted] = useState(false)

  function handleAcquire() {
    if (!kioskCode.trim()) {
      toast.error("Masukkan kode kiosk terlebih dahulu.")
      return
    }

    setAcquisition({
      code: kioskCode.trim().toUpperCase(),
      queueNumber: "A-023",
      department: "Poli Umum",
      visitNumber: "V-260920-00012",
      status: "ACQUIRED",
    })

    setSelectedPatient(null)
    setSearch("")

    toast.success("Queue acquisition ditemukan.")
  }

  function resetAcquisition() {
    setAcquisition(null)
    setKioskCode("")
    setSearch("")
    setSelectedPatient(null)
  }

  function handleSelectPatient(patient: Patient) {
    setSelectedPatient(patient)
    setSearch("")
  }

  function handleRegister() {
    if (!acquisition) {
      toast.error("Queue acquisition belum tersedia.")
      return
    }

    if (!selectedPatient) {
      toast.error("Pilih pasien terlebih dahulu.")
      return
    }

    setCompleted(true)

    toast.success("Pasien berhasil didaftarkan.", {
      description: `${selectedPatient.name} mendapatkan nomor ${acquisition.queueNumber}.`,
    })
  }

  const searchResults = search.trim()
    ? patients.filter((patient) =>
        [patient.name, patient.medicalRecordNumber, patient.nik, patient.phone]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : []

  if (!acquisition) {
    return (
      <div className="mx-auto max-w-3xl p-6 lg:p-10">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ScanLineIcon className="size-6" />
            </div>

            <CardTitle className="mt-2">Registrasi Kiosk</CardTitle>

            <CardDescription>
              Masukkan atau scan kode kiosk untuk mengambil queue acquisition.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="kiosk-code">Kode Kiosk</Label>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <ScanLineIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    id="kiosk-code"
                    value={kioskCode}
                    onChange={(event) => setKioskCode(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault()
                        handleAcquire()
                      }
                    }}
                    placeholder="Contoh: QA-8F92-..."
                    className="pl-9"
                    autoFocus
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => toast.info("Scanner QR belum dihubungkan.")}
                >
                  Scan QR
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Kode dapat dimasukkan secara manual atau dipindai menggunakan QR
                scanner.
              </p>
            </div>

            <Button
              type="button"
              size="lg"
              className="w-full"
              onClick={handleAcquire}
            >
              <SearchIcon />
              Cari Acquisition
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (completed) {
    return (
      <div className="mx-auto max-w-3xl p-6 lg:p-10">
        <Card className="border-primary/20 bg-primary/[0.03]">
          <CardHeader className="text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2Icon className="size-6" />
            </div>

            <Badge className="mx-auto mt-2">Registrasi berhasil</Badge>

            <CardTitle className="text-2xl">{selectedPatient?.name}</CardTitle>

            <CardDescription>
              Pasien berhasil terhubung dengan queue acquisition.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="rounded-xl border bg-background p-6 text-center">
              <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
                Nomor Antrian
              </p>

              <p className="mt-2 text-5xl font-bold tracking-tight">
                {acquisition.queueNumber}
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                {acquisition.department}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">No. Rekam Medis</p>

                <p className="mt-1 font-medium">
                  {selectedPatient?.medicalRecordNumber}
                </p>
              </div>

              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">Visit</p>

                <p className="mt-1 font-medium">{acquisition.visitNumber}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline">Print Number</Button>

              <Button onClick={resetAcquisition}>Selesai</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-6 p-6 lg:grid-cols-[360px_1fr]">
      <Card className="h-fit border-primary/20 bg-primary/[0.03] lg:sticky lg:top-6">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">Queue Acquisition</CardTitle>

            <Badge>{acquisition.status}</Badge>
          </div>

          <CardDescription>
            Queue dari kiosk berhasil ditemukan.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="rounded-xl border bg-background p-5 text-center">
            <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
              Nomor Antrian
            </p>

            <p className="mt-1 text-4xl font-bold">{acquisition.queueNumber}</p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Kiosk</span>

              <span className="font-medium">{acquisition.code}</span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Poli</span>

              <span className="font-medium">{acquisition.department}</span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Visit</span>

              <span className="font-medium">{acquisition.visitNumber}</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Status</span>

              <Badge variant="outline">{acquisition.status}</Badge>
            </div>
          </div>

          <Separator />

          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-xs text-muted-foreground">Pasien Terpilih</p>

            <p className="mt-1 font-medium">
              {selectedPatient?.name ?? "Belum dipilih"}
            </p>

            {selectedPatient && (
              <p className="mt-1 text-xs text-muted-foreground">
                {selectedPatient.medicalRecordNumber}
              </p>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={resetAcquisition}
          >
            Cari Kiosk Lain
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cari Pasien</CardTitle>

          <CardDescription>
            Cari pasien yang akan dihubungkan dengan queue acquisition ini.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {!selectedPatient && (
            <>
              <div className="space-y-2">
                <Label htmlFor="patient-search">Pasien</Label>

                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    id="patient-search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Nama / No. RM / NIK / No. HP"
                    className="pl-9"
                    autoFocus
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  Gunakan informasi yang tersedia dari pasien untuk menemukan
                  data yang sesuai.
                </p>
              </div>

              {search && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Hasil pencarian
                  </p>

                  {searchResults.map((patient) => (
                    <button
                      key={patient.medicalRecordNumber}
                      type="button"
                      onClick={() => handleSelectPatient(patient)}
                      className="flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors hover:bg-muted"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{patient.name}</p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {patient.medicalRecordNumber}
                        </p>
                      </div>

                      <span className="ml-4 shrink-0 text-xs text-muted-foreground">
                        {patient.phone}
                      </span>
                    </button>
                  ))}

                  {!searchResults.length && (
                    <div className="rounded-lg border border-dashed p-6 text-center">
                      <UserRoundIcon className="mx-auto size-5 text-muted-foreground" />

                      <p className="mt-2 text-sm font-medium">
                        Pasien tidak ditemukan
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Periksa kembali nama, nomor RM, NIK, atau nomor telepon.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {selectedPatient && (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge variant="outline">Pasien terpilih</Badge>

                  <h3 className="mt-2 text-xl font-semibold">
                    {selectedPatient.name}
                  </h3>

                  <p className="text-sm text-muted-foreground">
                    {selectedPatient.medicalRecordNumber}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedPatient(null)
                    setSearch("")
                  }}
                >
                  Ganti Pasien
                </Button>
              </div>

              <div className="rounded-xl border bg-muted/20 p-5">
                <p className="mb-4 text-sm font-medium">
                  Verifikasi Data Pasien
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground">
                      <IdCardIcon className="size-4" />
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">NIK</p>

                      <p className="text-sm font-medium">
                        {selectedPatient.nik}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground">
                      <CalendarDaysIcon className="size-4" />
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Tanggal Lahir
                      </p>

                      <p className="text-sm font-medium">
                        {selectedPatient.birthDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground">
                      <UserRoundIcon className="size-4" />
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Jenis Kelamin
                      </p>

                      <p className="text-sm font-medium">
                        {selectedPatient.gender}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground">
                      <PhoneIcon className="size-4" />
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        No. Telepon
                      </p>

                      <p className="text-sm font-medium">
                        {selectedPatient.phone}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-5">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle2Icon className="size-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-medium">Siap didaftarkan</p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Queue{" "}
                      <span className="font-medium text-foreground">
                        {acquisition.queueNumber}
                      </span>{" "}
                      dari{" "}
                      <span className="font-medium text-foreground">
                        {acquisition.department}
                      </span>{" "}
                      akan diberikan kepada pasien ini.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                size="lg"
                className="w-full"
                onClick={handleRegister}
              >
                <ClipboardCheckIcon />
                Daftarkan {selectedPatient.name}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
