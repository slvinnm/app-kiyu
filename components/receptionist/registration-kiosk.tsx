"use client"

import { useState } from "react"
import { toast } from "sonner"

import { PatientSearch } from "@/components/receptionist/kiosk/patient-search"
import { QueueAcquisitionSearch } from "@/components/receptionist/kiosk/queue-acquisition-search"
import { QueueAcquisitionSummary } from "@/components/receptionist/kiosk/queue-acquisition-summary"
import { RegistrationSuccess } from "@/components/receptionist/kiosk/registration-success"
import { SelectedPatient } from "@/components/receptionist/kiosk/selected-patient"
import { useReceptionPatientSearch } from "@/hooks/use-reception-patient-search"
import { useReceptionQueueAcquisitionSearch } from "@/hooks/use-reception-queue-acquisition-search"
import { ApiError } from "@/lib/api/error"
import { registerQueueAcquisition } from "@/lib/api/reception"
import type {
  KioskRegistrationSuccess,
  Patient,
  QueueAcquisition,
} from "@/types/reception"

export function RegistrationKiosk() {
  const [acquisitionSearch, setAcquisitionSearch] = useState("")

  const [acquisition, setAcquisition] = useState<QueueAcquisition | null>(null)

  const [patientSearch, setPatientSearch] = useState("")

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  const [registering, setRegistering] = useState(false)

  const [success, setSuccess] = useState<KioskRegistrationSuccess | null>(null)

  const { results: acquisitionResults, searching: searchingAcquisition } =
    useReceptionQueueAcquisitionSearch(acquisitionSearch)

  const { results: patientResults, searching: searchingPatient } =
    useReceptionPatientSearch(patientSearch)

  function handleSelectAcquisition(value: QueueAcquisition) {
    setAcquisition(value)
    setAcquisitionSearch("")
    setSelectedPatient(null)
    setPatientSearch("")
  }

  function handlePatientSearchChange(value: string) {
    setPatientSearch(value)
    setSelectedPatient(null)
  }

  function handleSelectPatient(patient: Patient) {
    setSelectedPatient(patient)
    setPatientSearch("")
  }

  function handleChangePatient() {
    setSelectedPatient(null)
    setPatientSearch("")
  }

  async function handleRegister() {
    if (!acquisition) {
      toast.error("Queue acquisition belum dipilih.")
      return
    }

    if (!selectedPatient) {
      toast.error("Pilih pasien terlebih dahulu.")
      return
    }

    if (registering) {
      return
    }

    setRegistering(true)

    try {
      const response = await registerQueueAcquisition(
        acquisition.id,
        selectedPatient.id
      )

      setSuccess({
        patient: selectedPatient,
        acquisition: response.data,
      })

      toast.success(response.message)
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Gagal mendaftarkan queue acquisition."

      toast.error(message)
    } finally {
      setRegistering(false)
    }
  }

  function resetRegistration() {
    setSuccess(null)
    setAcquisitionSearch("")
    setAcquisition(null)
    setPatientSearch("")
    setSelectedPatient(null)
  }

  if (success) {
    return <RegistrationSuccess success={success} onReset={resetRegistration} />
  }

  if (!acquisition) {
    return (
      <div className="mx-auto max-w-3xl p-6 lg:p-10">
        <QueueAcquisitionSearch
          search={acquisitionSearch}
          results={acquisitionResults}
          selected={acquisition}
          searching={searchingAcquisition}
          onSearchChange={setAcquisitionSearch}
          onSelect={handleSelectAcquisition}
        />
      </div>
    )
  }

  return (
    <div className="grid gap-6 p-6 lg:grid-cols-[360px_1fr]">
      <QueueAcquisitionSummary
        acquisition={acquisition}
        selectedPatient={selectedPatient}
        onReset={resetRegistration}
      />

      <div>
        {!selectedPatient ? (
          <PatientSearch
            search={patientSearch}
            results={patientResults}
            selected={selectedPatient}
            searching={searchingPatient}
            onSearchChange={handlePatientSearchChange}
            onSelect={handleSelectPatient}
          />
        ) : (
          <SelectedPatient
            patient={selectedPatient}
            acquisition={acquisition}
            registering={registering}
            onChangePatient={handleChangePatient}
            onRegister={handleRegister}
          />
        )}
      </div>
    </div>
  )
}
