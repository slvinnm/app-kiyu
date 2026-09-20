"use client"

import { useState } from "react"
import {
  CheckCircle2Icon,
  PrinterIcon,
  SearchIcon,
  UserPlusIcon,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

type Patient = {
  medicalRecordNumber: string
  name: string
  phone: string
  nik: string
  birthDate: string
  gender: string
}

const patients: Patient[] = [
  {
    medicalRecordNumber: "RM-000123",
    name: "Budi Santoso",
    phone: "081234567890",
    nik: "3573010101900001",
    birthDate: "1990-01-01",
    gender: "Laki-laki",
  },
  {
    medicalRecordNumber: "RM-000124",
    name: "Siti Aminah",
    phone: "082112345678",
    nik: "3573010202910002",
    birthDate: "1991-02-02",
    gender: "Perempuan",
  },
]

export function RegistrationWalkIn() {
  const [patientType, setPatientType] = useState<"existing" | "new">("existing")

  const [search, setSearch] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  const [name, setName] = useState("")
  const [nik, setNik] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [gender, setGender] = useState("")
  const [phone, setPhone] = useState("")
  const [department, setDepartment] = useState("")

  const [success, setSuccess] = useState<{
    patientName: string
    department: string
    queueNumber: string
    visitNumber: string
  } | null>(null)

  const searchResults = search.trim()
    ? patients.filter((patient) =>
        [patient.name, patient.medicalRecordNumber, patient.nik, patient.phone]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : []

  function handlePatientTypeChange(type: "existing" | "new") {
    setPatientType(type)

    setSearch("")
    setSelectedPatient(null)

    if (type === "new") {
      setName("")
      setNik("")
      setBirthDate("")
      setGender("")
      setPhone("")
    }
  }

  function selectPatient(patient: Patient) {
    setSelectedPatient(patient)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (patientType === "existing" && !selectedPatient) {
      toast.error("Pilih pasien terlebih dahulu.")
      return
    }

    if (patientType === "new" && !name.trim()) {
      toast.error("Nama pasien wajib diisi.")
      return
    }

    if (!department) {
      toast.error("Pilih poli atau department terlebih dahulu.")
      return
    }

    const patientName =
      patientType === "existing" ? (selectedPatient?.name ?? "") : name

    setSuccess({
      patientName,
      department,
      queueNumber: "A-023",
      visitNumber: "V-260920-00012",
    })

    toast.success("Registrasi berhasil")
  }

  function resetRegistration() {
    setSuccess(null)
    setPatientType("existing")
    setSearch("")
    setSelectedPatient(null)
    setName("")
    setNik("")
    setBirthDate("")
    setGender("")
    setPhone("")
    setDepartment("")
  }

  if (success) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-6">
        <Card className="w-full max-w-2xl overflow-hidden">
          <CardHeader className="border-b bg-muted/30 pb-6">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400">
                <CheckCircle2Icon className="size-8" />
              </div>

              <Badge
                variant="secondary"
                className="mb-3 rounded-full px-3 py-1"
              >
                Registrasi berhasil
              </Badge>

              <CardTitle className="text-2xl">
                Pasien berhasil didaftarkan
              </CardTitle>

              <CardDescription className="mt-1">
                Kunjungan pasien telah berhasil dibuat.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 p-6">
            {/* Queue Number */}
            <div className="rounded-2xl border bg-background p-6 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                Nomor Antrian
              </p>

              <p className="mt-2 text-6xl font-bold tracking-tight">
                {success.queueNumber}
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                {success.department}
              </p>
            </div>

            {/* Patient Information */}
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                  Pasien
                </p>

                <p className="mt-1 text-lg font-semibold">
                  {success.patientName}
                </p>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Visit</p>

                  <p className="mt-1 text-sm font-medium">
                    {success.visitNumber}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Station</p>

                  <p className="mt-1 text-sm font-medium">Registration</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              <Button variant="outline" className="h-11">
                <PrinterIcon className="mr-2 size-4" />
                Cetak Nomor Antrian
              </Button>

              <Button onClick={resetRegistration} className="h-11">
                Registrasi Pasien Berikutnya
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Registrasi Walk-in</h2>

            <p className="text-sm text-muted-foreground">
              Daftarkan pasien yang datang langsung ke fasilitas.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Jenis Pasien</CardTitle>

              <CardDescription>
                Tentukan apakah pasien sudah terdaftar sebelumnya.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handlePatientTypeChange("existing")}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    patientType === "existing"
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted"
                  }`}
                >
                  <p className="font-medium">Pasien Lama</p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Cari pasien yang sudah terdaftar.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handlePatientTypeChange("new")}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    patientType === "new"
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted"
                  }`}
                >
                  <p className="font-medium">Pasien Baru</p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Buat data pasien baru.
                  </p>
                </button>
              </div>
            </CardContent>
          </Card>

          {patientType === "existing" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cari Pasien</CardTitle>

                <CardDescription>
                  Cari berdasarkan nama, nomor rekam medis, NIK, atau nomor
                  telepon.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Nama / No. RM / NIK / No. HP"
                      className="pl-9"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      toast.info("Pencarian menggunakan data dummy.")
                    }
                  >
                    Cari
                  </Button>
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
                        onClick={() => selectPatient(patient)}
                        className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted ${
                          selectedPatient?.medicalRecordNumber ===
                          patient.medicalRecordNumber
                            ? "border-primary bg-primary/5"
                            : ""
                        }`}
                      >
                        <div>
                          <p className="font-medium">{patient.name}</p>

                          <p className="text-xs text-muted-foreground">
                            {patient.medicalRecordNumber}
                          </p>
                        </div>

                        <span className="text-xs text-muted-foreground">
                          {patient.phone}
                        </span>
                      </button>
                    ))}

                    {!searchResults.length && (
                      <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                        Pasien tidak ditemukan.
                      </div>
                    )}
                  </div>
                )}

                {selectedPatient && (
                  <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-4">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <CheckCircle2Icon className="size-5" />
                      </div>

                      <div>
                        <p className="font-medium">{selectedPatient.name}</p>

                        <p className="text-xs text-muted-foreground">
                          {selectedPatient.medicalRecordNumber}
                        </p>
                      </div>

                      <Badge variant="outline" className="ml-auto">
                        Selected
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">NIK</p>

                        <p className="font-medium">{selectedPatient.nik}</p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          No. Telepon
                        </p>

                        <p className="font-medium">{selectedPatient.phone}</p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Tanggal Lahir
                        </p>

                        <p className="font-medium">
                          {selectedPatient.birthDate}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Jenis Kelamin
                        </p>

                        <p className="font-medium">{selectedPatient.gender}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {patientType === "new" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Data Pasien Baru</CardTitle>

                <CardDescription>
                  Lengkapi identitas pasien untuk membuat rekam medis baru.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="name">Nama</Label>

                    <Input
                      id="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Nama lengkap pasien"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nik">NIK</Label>

                    <Input
                      id="nik"
                      value={nik}
                      onChange={(event) => setNik(event.target.value)}
                      placeholder="16 digit NIK"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Tanggal Lahir</Label>

                    <Input
                      id="birthDate"
                      type="date"
                      value={birthDate}
                      onChange={(event) => setBirthDate(event.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Jenis Kelamin</Label>

                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih jenis kelamin" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="Laki-laki">Laki-laki</SelectItem>

                        <SelectItem value="Perempuan">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">No. Telepon</Label>

                    <Input
                      id="phone"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="08xxxxxxxxxx"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kunjungan</CardTitle>

              <CardDescription>
                Tentukan poli atau department tujuan pasien.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-2">
                <Label>Poli / Department</Label>

                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih poli" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="Poli Umum">Poli Umum</SelectItem>

                    <SelectItem value="Poli Gigi">Poli Gigi</SelectItem>

                    <SelectItem value="Poli Anak">Poli Anak</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ringkasan</CardTitle>

              <CardDescription>
                Periksa data sebelum membuat kunjungan.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">Tipe Pasien</p>

                <p className="mt-1 font-medium">
                  {patientType === "existing" ? "Pasien Lama" : "Pasien Baru"}
                </p>
              </div>

              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">Pasien</p>

                <p className="mt-1 font-medium">
                  {patientType === "existing"
                    ? selectedPatient?.name || "Belum dipilih"
                    : name || "Belum diisi"}
                </p>

                {patientType === "existing" && selectedPatient && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {selectedPatient.medicalRecordNumber}
                  </p>
                )}
              </div>

              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">Department</p>

                <p className="mt-1 font-medium">
                  {department || "Belum dipilih"}
                </p>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={patientType === "existing" && !selectedPatient}
              >
                <UserPlusIcon />
                Daftarkan Kunjungan
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Nomor antrian akan dibuat otomatis setelah registrasi berhasil.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  )
}
