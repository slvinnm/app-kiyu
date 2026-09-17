import { serverApiFetch } from "@/lib/api/server"

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

export default async function Page() {
  const response = await serverApiFetch<VisitsResponse>("/patient/visits")

  return (
    <div>
      <h1>Halaman Pasien</h1>

      <h2>Riwayat Kunjungan</h2>

      {response.data.length === 0 ? (
        <p>Belum ada kunjungan.</p>
      ) : (
        response.data.map((visit) => (
          <div key={visit.id}>
            <p>Dokter: {visit.doctor_name}</p>
            <p>Tanggal: {visit.visit_date}</p>
            <p>Status: {visit.status}</p>
          </div>
        ))
      )}
    </div>
  )
}
