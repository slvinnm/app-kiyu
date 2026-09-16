import { logout } from "@/lib/actions/auth"

export default function Page() {
  return (
    <div>
      <h1>Halaman Pasien</h1>

      <form action={logout}>
        <button type="submit">Logout</button>
      </form>
    </div>
  )
}
