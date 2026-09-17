import { logout } from "@/lib/actions/auth"
import PatientVisits from "@/components/patient-visits"

export default function Page() {
  return (
    <div>
      <h1>Halaman Pasien</h1>

      <form action={logout}>
        <button type="submit">Logout</button>
      </form>

      <PatientVisits />
    </div>
  )
}
