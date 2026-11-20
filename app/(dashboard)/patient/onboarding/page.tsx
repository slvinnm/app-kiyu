import { ClipboardCheckIcon } from "lucide-react"
import { redirect } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { PatientLoadError } from "@/components/patient/patient-notices"
import { PatientProfileForm } from "@/components/patient/profile-form"

import { getApiErrorMessage } from "@/lib/api/error"
import { getCurrentPatientServer } from "@/lib/api/patient-server"
import { getSession } from "@/lib/auth/session"

export default async function Page() {
  const session = await getSession()

  if (!session?.user?.role) {
    redirect("/login")
  }

  let current

  try {
    current = await getCurrentPatientServer()
  } catch (cause) {
    return (
      <div className="mx-auto w-full max-w-3xl p-4 md:p-6 lg:p-8">
        <PageHeader />

        <PatientLoadError
          message={getApiErrorMessage(cause, "Gagal memuat profil pasien.")}
        />
      </div>
    )
  }

  // Already onboarded — the dashboard is the right destination.
  if (current.profile) {
    redirect("/patient/dashboard")
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-6 lg:p-8">
      <PageHeader />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Lengkapi Data Pasien</CardTitle>

          <CardDescription>
            Data ini diperlukan agar Anda dapat melakukan booking dan melihat
            antrian. Nama dan email sudah terisi dari akun Anda.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <PatientProfileForm
            userId={current.user.id}
            profile={null}
            defaultName={current.user.name}
            defaultEmail={current.user.email}
            redirectTo="/patient/dashboard"
          />
        </CardContent>
      </Card>
    </div>
  )
}

function PageHeader() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Badge variant="outline">Pasien</Badge>

        <span className="text-xs text-muted-foreground">Onboarding</span>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ClipboardCheckIcon className="size-5" />
        </div>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Selamat datang
          </h1>

          <p className="text-sm text-muted-foreground">
            Satu langkah lagi sebelum Anda dapat menggunakan layanan.
          </p>
        </div>
      </div>
    </div>
  )
}
