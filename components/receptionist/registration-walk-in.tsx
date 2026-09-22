"use client"

import { useState } from "react"
import type { SyntheticEvent } from "react"
import { toast } from "sonner"

import { DepartmentSelect } from "@/components/receptionist/walk-in/department-select"
import { NewPatientForm } from "@/components/receptionist/walk-in/new-patient-form"
import { PatientSearch } from "@/components/receptionist/walk-in/patient-search"
import { PatientTypeSelector } from "@/components/receptionist/walk-in/patient-type-selector"
import { RegistrationSuccess } from "@/components/receptionist/walk-in/registration-success"
import { RegistrationSummary } from "@/components/receptionist/walk-in/registration-summary"

import { useReceptionDepartments } from "@/hooks/use-reception-departments"
import { useReceptionPatientSearch } from "@/hooks/use-reception-patient-search"

import { ApiError } from "@/lib/api/error"
import { registerReceptionVisit } from "@/lib/api/reception"

import type { NewPatientData, WalkInSuccess } from "@/types/reception"

const initialNewPatient: NewPatientData = {
  name: "",
  email: "",
  national_id: "",
  date_of_birth: "",
  gender: "",
  phone: "",
  address: "",
}

export function RegistrationWalkIn() {
  const [patientType, setPatientType] = useState<"existing" | "new">("existing")

  const [search, setSearch] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<
    import("@/types/reception").Patient | null
  >(null)

  const [newPatient, setNewPatient] =
    useState<NewPatientData>(initialNewPatient)

  const [departmentCode, setDepartmentCode] = useState("")

  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<WalkInSuccess | null>(null)

  const { results: searchResults, searching } =
    useReceptionPatientSearch(search)

  const { departments, loading: loadingDepartments } = useReceptionDepartments()

  function handlePatientTypeChange(type: "existing" | "new") {
    setPatientType(type)
    setSearch("")
    setSelectedPatient(null)
    setNewPatient(initialNewPatient)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setSelectedPatient(null)
  }

  function handlePatientSelect(patient: import("@/types/reception").Patient) {
    setSelectedPatient(patient)
    setSearch("")
  }

  function handleNewPatientChange(value: Partial<NewPatientData>) {
    setNewPatient((current) => ({
      ...current,
      ...value,
    }))
  }

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submitting) {
      return
    }

    if (patientType === "existing" && !selectedPatient) {
      toast.error("Pilih pasien terlebih dahulu.")
      return
    }

    if (patientType === "new" && !newPatient.name.trim()) {
      toast.error("Nama pasien wajib diisi.")
      return
    }

    if (!departmentCode) {
      toast.error("Pilih poli atau department terlebih dahulu.")
      return
    }

    const payload =
      patientType === "existing"
        ? {
            department_code: departmentCode,
            patient_id: selectedPatient!.id,
          }
        : {
            department_code: departmentCode,
            name: newPatient.name.trim(),
            email: newPatient.email.trim() || null,
            national_id: newPatient.national_id.trim() || null,
            date_of_birth: newPatient.date_of_birth || null,
            gender: newPatient.gender || null,
            phone: newPatient.phone.trim() || null,
            address: newPatient.address.trim() || null,
          }

    setSubmitting(true)

    try {
      const response = await registerReceptionVisit(payload)

      setSuccess({
        patientName:
          patientType === "existing"
            ? selectedPatient!.name
            : newPatient.name.trim(),
        visit: response.data,
      })

      toast.success(response.message)
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Gagal melakukan registrasi."

      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  function resetRegistration() {
    setSuccess(null)
    setPatientType("existing")
    setSearch("")
    setSelectedPatient(null)
    setNewPatient(initialNewPatient)
    setDepartmentCode("")
  }

  const selectedDepartment = departments.find(
    (department) => department.code === departmentCode
  )

  if (success) {
    return <RegistrationSuccess success={success} onReset={resetRegistration} />
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

          <PatientTypeSelector
            value={patientType}
            onChange={handlePatientTypeChange}
          />

          {patientType === "existing" && (
            <PatientSearch
              search={search}
              results={searchResults}
              selectedPatient={selectedPatient}
              searching={searching}
              onSearchChange={handleSearchChange}
              onSelect={handlePatientSelect}
            />
          )}

          {patientType === "new" && (
            <NewPatientForm
              value={newPatient}
              onChange={handleNewPatientChange}
            />
          )}

          <DepartmentSelect
            value={departmentCode}
            departments={departments}
            loading={loadingDepartments}
            onChange={setDepartmentCode}
          />
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <RegistrationSummary
            patientType={patientType}
            selectedPatient={selectedPatient}
            patientName={newPatient.name}
            department={selectedDepartment}
            submitting={submitting}
            disabled={
              submitting ||
              loadingDepartments ||
              !departmentCode ||
              (patientType === "existing" && !selectedPatient)
            }
          />
        </div>
      </div>
    </form>
  )
}
