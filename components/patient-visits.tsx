"use client"

import { useEffect, useState } from "react"

import { apiFetch } from "@/lib/api/client"

type Visit = {
  id: number
  patient_name: string
  doctor_name: string
  visit_date: string
  status: string
}

type VisitsResponse = {
  success: boolean
  message: string
  data: Visit[]
}

export default function PatientVisits() {
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchVisits() {
    try {
      setLoading(true)
      setError(null)

      const response = await apiFetch<VisitsResponse>("/patient/visits")

      setVisits(response.data)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Gagal mengambil data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVisits()
  }, [])

  if (loading) {
    return <p>Loading visits...</p>
  }

  if (error) {
    return (
      <div>
        <p>Error: {error}</p>

        <button type="button" onClick={fetchVisits}>
          Coba lagi
        </button>
      </div>
    )
  }

  return (
    <div>
      <h2>Riwayat Kunjungan</h2>

      {visits.length === 0 ? (
        <p>Belum ada kunjungan.</p>
      ) : (
        visits.map((visit) => (
          <div key={visit.id}>
            <p>Dokter: {visit.doctor_name}</p>
            <p>Tanggal: {visit.visit_date}</p>
            <p>Status: {visit.status}</p>
          </div>
        ))
      )}

      <button type="button" onClick={fetchVisits}>
        Refresh
      </button>
    </div>
  )
}
