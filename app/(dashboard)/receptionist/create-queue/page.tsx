"use client"

import { useEffect, useMemo, useState } from "react"
import type { SyntheticEvent } from "react"
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  SearchIcon,
  UserRoundIcon,
  UserRoundPlusIcon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"

import { ApiError } from "@/lib/api/error"
import { apiFetch } from "@/lib/api/client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

type Department = {
  id: number
  code: string
  name: string
}

type Patient = {
  id: number
  medical_record_number: string
  name: string
  date_of_birth: string | null
  gender: string | null
  phone: string | null
  email: string | null
  address: string | null
}

type ManualQueueAcquisition = {
  id: number
  status: "ACQUIRED"
  channel: "MANUAL"
  acquired_at: string
  registered_at: string | null
  department: {
    id: number
    code: string
    name: string
  }
  patient: {
    id: number
    name: string
    medical_record_number: string
  } | null
  visit: {
    id: number
    visit_number: string
    status: "WAITING"
  }
  queue_ticket: {
    id: number
    queue_number: string
    status: "CREATED"
    priority: number
    station_id: number | null
    called_at: string | null
    started_at: string | null
    completed_at: string | null
  } | null
}

type NewPatientForm = {
  name: string
  national_id: string
  date_of_birth: string
  gender: "" | "male" | "female"
  phone: string
  email: string
  address: string
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function Page() {
  const [open, setOpen] = useState(false)

  const [departments, setDepartments] = useState<Department[]>([])
  const [loadingDepartments, setLoadingDepartments] = useState(false)

  const [departmentOpen, setDepartmentOpen] = useState(false)

  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null)

  const [patientMode, setPatientMode] = useState<"existing" | "new">("existing")

  const [patientSearch, setPatientSearch] = useState("")
  const [patientResults, setPatientResults] = useState<Patient[]>([])
  const [searchingPatients, setSearchingPatients] = useState(false)

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  const [newPatient, setNewPatient] = useState<NewPatientForm>({
    name: "",
    national_id: "",
    date_of_birth: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
  })

  const [creatingQueue, setCreatingQueue] = useState(false)

  const [createdQueue, setCreatedQueue] =
    useState<ManualQueueAcquisition | null>(null)

  /* ------------------------------------------------------------------------ */
  /* Departments                                                              */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!open || departments.length > 0) {
      return
    }

    let active = true
    const controller = new AbortController()

    async function loadDepartments() {
      setLoadingDepartments(true)

      try {
        const response = await apiFetch<ApiResponse<Department[]>>(
          "/reception/departments",
          {
            signal: controller.signal,
          }
        )

        if (!active) {
          return
        }

        setDepartments(response.data)
      } catch (error) {
        if (!active || controller.signal.aborted) {
          return
        }

        const message =
          error instanceof ApiError
            ? error.message
            : "Gagal mengambil daftar departemen."

        toast.error(message)
      } finally {
        if (active) {
          setLoadingDepartments(false)
        }
      }
    }

    loadDepartments()

    return () => {
      active = false
      controller.abort()
    }
  }, [departments.length, open])

  /* ------------------------------------------------------------------------ */
  /* Patient Search                                                           */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const keyword = patientSearch.trim()

    if (!open || patientMode !== "existing" || !keyword) {
      setPatientResults([])
      setSearchingPatients(false)
      return
    }

    let active = true
    const controller = new AbortController()

    const timeout = setTimeout(async () => {
      setSearchingPatients(true)

      try {
        const response = await apiFetch<ApiResponse<Patient[]>>(
          `/reception/patients?search=${encodeURIComponent(keyword)}`,
          {
            signal: controller.signal,
          }
        )

        if (!active) {
          return
        }

        setPatientResults(response.data)
      } catch (error) {
        if (!active || controller.signal.aborted) {
          return
        }

        const message =
          error instanceof ApiError ? error.message : "Gagal mencari pasien."

        toast.error(message)
        setPatientResults([])
      } finally {
        if (active) {
          setSearchingPatients(false)
        }
      }
    }, 400)

    return () => {
      active = false
      clearTimeout(timeout)
      controller.abort()
    }
  }, [open, patientMode, patientSearch])

  /* ------------------------------------------------------------------------ */
  /* Derived State                                                            */
  /* ------------------------------------------------------------------------ */

  const canCreateQueue = useMemo(() => {
    if (!selectedDepartment) {
      return false
    }

    if (patientMode === "existing") {
      return selectedPatient !== null
    }

    return newPatient.name.trim() !== ""
  }, [newPatient.name, patientMode, selectedDepartment, selectedPatient])

  /* ------------------------------------------------------------------------ */
  /* Handlers                                                                 */
  /* ------------------------------------------------------------------------ */

  function resetForm() {
    setSelectedDepartment(null)

    setPatientMode("existing")
    setPatientSearch("")
    setPatientResults([])
    setSelectedPatient(null)

    setNewPatient({
      name: "",
      national_id: "",
      date_of_birth: "",
      gender: "",
      phone: "",
      email: "",
      address: "",
    })

    setCreatedQueue(null)
    setDepartmentOpen(false)
    setCreatingQueue(false)
  }

  function handleOpenChange(value: boolean) {
    setOpen(value)

    if (!value) {
      resetForm()
    }
  }

  function handleSelectDepartment(department: Department) {
    setSelectedDepartment(department)
    setDepartmentOpen(false)

    setPatientMode("existing")
    setPatientSearch("")
    setPatientResults([])
    setSelectedPatient(null)
  }

  function handleSelectPatient(patient: Patient) {
    setSelectedPatient(patient)
    setPatientSearch("")
    setPatientResults([])
  }

  function handleChangePatientMode(mode: "existing" | "new") {
    setPatientMode(mode)
    setSelectedPatient(null)
    setPatientSearch("")
    setPatientResults([])
  }

  function handleNewPatientChange(field: keyof NewPatientForm, value: string) {
    setNewPatient((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function handleClearPatient() {
    setSelectedPatient(null)
    setPatientSearch("")
    setPatientResults([])
  }

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedDepartment) {
      toast.error("Pilih departemen terlebih dahulu.")
      return
    }

    if (patientMode === "existing" && !selectedPatient) {
      toast.error("Pilih pasien terlebih dahulu.")
      return
    }

    if (patientMode === "new" && !newPatient.name.trim()) {
      toast.error("Nama pasien wajib diisi.")
      return
    }

    if (creatingQueue) {
      return
    }

    setCreatingQueue(true)

    try {
      let payload:
        | {
            department_code: string
            patient_id: number
          }
        | {
            department_code: string
            name: string
            email?: string
            national_id?: string
            date_of_birth?: string
            gender?: "male" | "female"
            phone?: string
            address?: string
          }

      if (patientMode === "existing") {
        payload = {
          department_code: selectedDepartment.code,
          patient_id: selectedPatient!.id,
        }
      } else {
        payload = {
          department_code: selectedDepartment.code,
          name: newPatient.name.trim(),
        }

        if (newPatient.email.trim()) {
          payload.email = newPatient.email.trim()
        }

        if (newPatient.national_id.trim()) {
          payload.national_id = newPatient.national_id.trim()
        }

        if (newPatient.date_of_birth) {
          payload.date_of_birth = newPatient.date_of_birth
        }

        if (newPatient.gender) {
          payload.gender = newPatient.gender
        }

        if (newPatient.phone.trim()) {
          payload.phone = newPatient.phone.trim()
        }

        if (newPatient.address.trim()) {
          payload.address = newPatient.address.trim()
        }
      }

      const response = await apiFetch<ApiResponse<ManualQueueAcquisition>>(
        "/reception/queue-acquisitions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      )

      setCreatedQueue(response.data)
      toast.success(response.message)
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Gagal membuat antrian."

      toast.error(message)
    } finally {
      setCreatingQueue(false)
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Page                                                                     */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      {/* Temporary trigger for testing */}
      <Button size="lg" onClick={() => setOpen(true)}>
        <UserRoundPlusIcon />
        Buat Antrian
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-3xl">
          {!createdQueue ? (
            <>
              {/* Dialog Header */}
              <DialogHeader className="border-b px-6 py-5">
                <div className="flex items-start gap-3 pr-8">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border">
                    <UserRoundPlusIcon className="size-5" />
                  </div>

                  <div>
                    <DialogTitle>Buat Antrian</DialogTitle>

                    <DialogDescription className="mt-1">
                      Buat antrian baru untuk pasien yang datang langsung ke
                      resepsionis.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <form
                onSubmit={handleSubmit}
                className="flex max-h-[calc(90vh-88px)] flex-col"
              >
                <div className="flex-1 overflow-y-auto px-6 py-6">
                  <div className="space-y-8">
                    {/* -------------------------------------------------- */}
                    {/* Department                                         */}
                    {/* -------------------------------------------------- */}

                    <section>
                      <div className="mb-4">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="size-6 justify-center rounded-full p-0"
                          >
                            1
                          </Badge>

                          <div>
                            <h3 className="text-sm font-semibold">
                              Tujuan Layanan
                            </h3>

                            <p className="text-xs text-muted-foreground">
                              Pilih departemen atau poli tujuan pasien.
                            </p>
                          </div>
                        </div>
                      </div>

                      <Popover
                        open={departmentOpen}
                        onOpenChange={setDepartmentOpen}
                      >
                        <PopoverTrigger
                          render={
                            <Button
                              type="button"
                              variant="outline"
                              disabled={loadingDepartments}
                              className="h-auto min-h-12 w-full justify-between px-4"
                            >
                              {loadingDepartments ? (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Spinner />
                                  Memuat departemen...
                                </div>
                              ) : selectedDepartment ? (
                                <div className="min-w-0 text-left">
                                  <p className="truncate font-medium">
                                    {selectedDepartment.name}
                                  </p>

                                  <p className="text-xs text-muted-foreground">
                                    {selectedDepartment.code}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">
                                  Pilih departemen / poli...
                                </span>
                              )}

                              <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
                            </Button>
                          }
                        />

                        <PopoverContent
                          className="w-[var(--radix-popover-trigger-width)] p-0"
                          align="start"
                        >
                          <Command>
                            <CommandInput placeholder="Cari departemen..." />

                            <CommandList>
                              <CommandEmpty>
                                Departemen tidak ditemukan.
                              </CommandEmpty>

                              <CommandGroup>
                                {departments.map((department) => (
                                  <CommandItem
                                    key={department.id}
                                    value={`${department.name} ${department.code}`}
                                    onSelect={() =>
                                      handleSelectDepartment(department)
                                    }
                                  >
                                    <div>
                                      <p className="font-medium">
                                        {department.name}
                                      </p>

                                      <p className="text-xs text-muted-foreground">
                                        {department.code}
                                      </p>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </section>

                    <Separator />

                    {/* -------------------------------------------------- */}
                    {/* Patient                                             */}
                    {/* -------------------------------------------------- */}

                    <section>
                      <div className="mb-4">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="size-6 justify-center rounded-full p-0"
                          >
                            2
                          </Badge>

                          <div>
                            <h3 className="text-sm font-semibold">Pasien</h3>

                            <p className="text-xs text-muted-foreground">
                              Pilih pasien yang sudah terdaftar atau buat pasien
                              baru.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div
                        className={
                          !selectedDepartment
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      >
                        {/* Patient Type */}
                        <div className="grid gap-2 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => handleChangePatientMode("existing")}
                            className={`rounded-xl border p-4 text-left transition-colors ${
                              patientMode === "existing"
                                ? "bg-muted"
                                : "hover:bg-muted/50"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background">
                                <SearchIcon className="size-4" />
                              </div>

                              <div>
                                <p className="text-sm font-medium">
                                  Pasien Lama
                                </p>

                                <p className="mt-1 text-xs text-muted-foreground">
                                  Cari pasien yang sudah terdaftar.
                                </p>
                              </div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleChangePatientMode("new")}
                            className={`rounded-xl border p-4 text-left transition-colors ${
                              patientMode === "new"
                                ? "bg-muted"
                                : "hover:bg-muted/50"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background">
                                <UserRoundPlusIcon className="size-4" />
                              </div>

                              <div>
                                <p className="text-sm font-medium">
                                  Pasien Baru
                                </p>

                                <p className="mt-1 text-xs text-muted-foreground">
                                  Daftarkan pasien baru sekaligus.
                                </p>
                              </div>
                            </div>
                          </button>
                        </div>

                        {/* Existing Patient */}
                        {patientMode === "existing" && (
                          <div className="mt-5">
                            {selectedPatient ? (
                              <div className="overflow-hidden rounded-xl border">
                                <div className="flex items-start gap-3 p-4">
                                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border">
                                    <UserRoundIcon className="size-4" />
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="font-medium">
                                        {selectedPatient.name}
                                      </p>

                                      <Badge variant="outline">
                                        Pasien Lama
                                      </Badge>
                                    </div>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                      {selectedPatient.medical_record_number}
                                    </p>

                                    {selectedPatient.phone && (
                                      <p className="mt-1 text-xs text-muted-foreground">
                                        {selectedPatient.phone}
                                      </p>
                                    )}
                                  </div>

                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleClearPatient}
                                  >
                                    <XIcon />

                                    <span className="sr-only">Ubah pasien</span>
                                  </Button>
                                </div>

                                <Separator />

                                <div className="grid gap-4 p-4 sm:grid-cols-3">
                                  <div>
                                    <p className="text-xs text-muted-foreground">
                                      Tanggal Lahir
                                    </p>

                                    <p className="mt-1 text-sm font-medium">
                                      {selectedPatient.date_of_birth ?? "-"}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs text-muted-foreground">
                                      Jenis Kelamin
                                    </p>

                                    <p className="mt-1 text-sm font-medium">
                                      {selectedPatient.gender ?? "-"}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs text-muted-foreground">
                                      Email
                                    </p>

                                    <p className="mt-1 truncate text-sm font-medium">
                                      {selectedPatient.email ?? "-"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="relative">
                                  <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />

                                  <Input
                                    value={patientSearch}
                                    onChange={(event) =>
                                      setPatientSearch(event.target.value)
                                    }
                                    placeholder="Cari nama, No. RM, NIK, atau telepon..."
                                    className="h-11 pl-9"
                                  />

                                  {patientSearch && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="absolute top-1/2 right-1 -translate-y-1/2"
                                      onClick={() => {
                                        setPatientSearch("")
                                        setPatientResults([])
                                      }}
                                    >
                                      <XIcon />

                                      <span className="sr-only">
                                        Hapus pencarian
                                      </span>
                                    </Button>
                                  )}
                                </div>

                                {searchingPatients && (
                                  <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                                    <Spinner />
                                    Mencari pasien...
                                  </div>
                                )}

                                {!searchingPatients &&
                                  patientSearch.trim() &&
                                  patientResults.length > 0 && (
                                    <div className="overflow-hidden rounded-xl border">
                                      {patientResults.map((patient) => (
                                        <button
                                          key={patient.id}
                                          type="button"
                                          onClick={() =>
                                            handleSelectPatient(patient)
                                          }
                                          className="flex w-full items-center gap-3 border-b p-4 text-left transition-colors last:border-b-0 hover:bg-muted/50"
                                        >
                                          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border">
                                            <UserRoundIcon className="size-4" />
                                          </div>

                                          <div className="min-w-0 flex-1">
                                            <p className="font-medium">
                                              {patient.name}
                                            </p>

                                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                              <span>
                                                {patient.medical_record_number}
                                              </span>

                                              {patient.phone && (
                                                <span>{patient.phone}</span>
                                              )}
                                            </div>
                                          </div>

                                          <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
                                        </button>
                                      ))}
                                    </div>
                                  )}

                                {!searchingPatients &&
                                  patientSearch.trim() &&
                                  patientResults.length === 0 && (
                                    <div className="rounded-xl border p-5 text-center">
                                      <p className="text-sm font-medium">
                                        Pasien tidak ditemukan
                                      </p>

                                      <p className="mt-1 text-xs text-muted-foreground">
                                        Anda dapat mendaftarkan pasien sebagai
                                        pasien baru.
                                      </p>

                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="mt-3"
                                        onClick={() =>
                                          handleChangePatientMode("new")
                                        }
                                      >
                                        <UserRoundPlusIcon />
                                        Pasien Baru
                                      </Button>
                                    </div>
                                  )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* New Patient */}
                        {patientMode === "new" && (
                          <div className="mt-5 space-y-5">
                            <div className="rounded-xl border bg-muted/30 p-4">
                              <p className="text-sm font-medium">
                                Data Pasien Baru
                              </p>

                              <p className="mt-1 text-xs text-muted-foreground">
                                Pasien dan antrian akan dibuat dalam satu
                                proses.
                              </p>
                            </div>

                            <div className="grid gap-5 md:grid-cols-2">
                              <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="name">
                                  Nama Lengkap
                                  <span className="text-destructive"> *</span>
                                </Label>

                                <Input
                                  id="name"
                                  value={newPatient.name}
                                  onChange={(event) =>
                                    handleNewPatientChange(
                                      "name",
                                      event.target.value
                                    )
                                  }
                                  placeholder="Masukkan nama lengkap pasien"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="national-id">NIK</Label>

                                <Input
                                  id="national-id"
                                  value={newPatient.national_id}
                                  onChange={(event) =>
                                    handleNewPatientChange(
                                      "national_id",
                                      event.target.value
                                    )
                                  }
                                  placeholder="16 digit NIK"
                                  inputMode="numeric"
                                  maxLength={16}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="phone">No. Telepon</Label>

                                <Input
                                  id="phone"
                                  value={newPatient.phone}
                                  onChange={(event) =>
                                    handleNewPatientChange(
                                      "phone",
                                      event.target.value
                                    )
                                  }
                                  placeholder="08xxxxxxxxxx"
                                  inputMode="tel"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="date-of-birth">
                                  Tanggal Lahir
                                </Label>

                                <div className="relative">
                                  <Input
                                    id="date-of-birth"
                                    type="date"
                                    value={newPatient.date_of_birth}
                                    onChange={(event) =>
                                      handleNewPatientChange(
                                        "date_of_birth",
                                        event.target.value
                                      )
                                    }
                                    className="pr-10"
                                  />

                                  <CalendarIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Jenis Kelamin</Label>

                                <Select
                                  value={newPatient.gender}
                                  onValueChange={(value) =>
                                    handleNewPatientChange("gender", value)
                                  }
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Pilih jenis kelamin" />
                                  </SelectTrigger>

                                  <SelectContent>
                                    <SelectItem value="male">
                                      Laki-laki
                                    </SelectItem>

                                    <SelectItem value="female">
                                      Perempuan
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="email">Email</Label>

                                <Input
                                  id="email"
                                  type="email"
                                  value={newPatient.email}
                                  onChange={(event) =>
                                    handleNewPatientChange(
                                      "email",
                                      event.target.value
                                    )
                                  }
                                  placeholder="nama@email.com"
                                />
                              </div>

                              <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="address">Alamat</Label>

                                <Textarea
                                  id="address"
                                  value={newPatient.address}
                                  onChange={(event) =>
                                    handleNewPatientChange(
                                      "address",
                                      event.target.value
                                    )
                                  }
                                  placeholder="Masukkan alamat pasien"
                                  rows={3}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t bg-background px-6 py-4">
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-muted-foreground">
                      Antrian akan dibuat dengan channel{" "}
                      <span className="font-medium text-foreground">
                        MANUAL
                      </span>
                      .
                    </p>

                    <Button
                      type="submit"
                      size="lg"
                      disabled={!canCreateQueue || creatingQueue}
                    >
                      {creatingQueue ? (
                        <>
                          <Spinner />
                          Membuat Antrian...
                        </>
                      ) : (
                        <>
                          Buat Antrian
                          <ArrowRightIcon />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </>
          ) : (
            /* ---------------------------------------------------------------- */
            /* Success                                                           */
            /* ---------------------------------------------------------------- */

            <>
              <DialogHeader className="border-b px-6 py-6 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full border">
                  <CheckCircle2Icon className="size-7" />
                </div>

                <Badge variant="outline" className="mx-auto mt-4 w-fit">
                  Antrian berhasil dibuat
                </Badge>

                <DialogTitle className="mt-2 text-2xl">
                  Pasien berhasil masuk antrian
                </DialogTitle>

                <DialogDescription>
                  Antrian telah dibuat dan menunggu untuk dipanggil.
                </DialogDescription>
              </DialogHeader>

              <div className="overflow-y-auto px-6 py-6">
                <div className="space-y-5">
                  <div className="rounded-2xl border p-7 text-center">
                    <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
                      Nomor Antrian
                    </p>

                    <p className="mt-3 text-7xl font-bold tracking-tight">
                      {createdQueue.queue_ticket?.queue_number ?? "-"}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      <span>{createdQueue.department.name}</span>

                      <span>•</span>

                      <span>{createdQueue.visit.status}</span>
                    </div>
                  </div>

                  <div className="rounded-xl border">
                    <div className="grid sm:grid-cols-2">
                      <div className="border-b p-4 sm:border-r">
                        <p className="text-xs text-muted-foreground">Pasien</p>

                        <p className="mt-1 font-medium">
                          {createdQueue.patient?.name ?? "-"}
                        </p>
                      </div>

                      <div className="border-b p-4">
                        <p className="text-xs text-muted-foreground">
                          No. Rekam Medis
                        </p>

                        <p className="mt-1 font-medium">
                          {createdQueue.patient?.medical_record_number ?? "-"}
                        </p>
                      </div>

                      <div className="border-b p-4 sm:border-r">
                        <p className="text-xs text-muted-foreground">
                          Nomor Visit
                        </p>

                        <p className="mt-1 font-medium">
                          {createdQueue.visit.visit_number}
                        </p>
                      </div>

                      <div className="border-b p-4">
                        <p className="text-xs text-muted-foreground">Status</p>

                        <p className="mt-1 font-medium">
                          {createdQueue.queue_ticket?.status ?? "-"}
                        </p>
                      </div>

                      <div className="p-4 sm:border-r">
                        <p className="text-xs text-muted-foreground">
                          Queue Acquisition
                        </p>

                        <p className="mt-1 font-medium">#{createdQueue.id}</p>
                      </div>

                      <div className="p-4">
                        <p className="text-xs text-muted-foreground">Channel</p>

                        <p className="mt-1 font-medium">
                          {createdQueue.channel}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-muted/50 p-4">
                    <p className="text-sm font-medium">
                      Pasien sedang menunggu
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Nomor antrian{" "}
                      <span className="font-medium text-foreground">
                        {createdQueue.queue_ticket?.queue_number ?? "-"}
                      </span>{" "}
                      sudah masuk ke antrian registrasi. Antrian belum
                      dipanggil.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Buat Antrian Baru
                    </Button>

                    <Button
                      type="button"
                      onClick={() => handleOpenChange(false)}
                    >
                      Selesai
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
