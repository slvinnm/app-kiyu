import {
  ClipboardCheckIcon,
  LogOutIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react"
import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { PatientLoadError } from "@/components/client/client-notices"
import { PatientProfileForm } from "@/components/client/profile-form"

import { logout } from "@/lib/actions/auth"
import { getApiErrorMessage } from "@/lib/api/error"
import { getCurrentClientServer } from "@/lib/api/clients-server"
import { requireRole } from "@/lib/auth/guard"

export default async function OnboardingPage() {
  const user = await requireRole(["client"])

  let current

  try {
    current = await getCurrentClientServer()
  } catch (cause) {
    return (
      <OnboardingShell email={user.email}>
        <PatientLoadError
          message={getApiErrorMessage(cause, "Gagal memuat profil pasien.")}
        />
      </OnboardingShell>
    )
  }

  // Already onboarded — send them to the dashboard.
  if (current.profile) {
    redirect("/client/dashboard")
  }

  return (
    <OnboardingShell email={current.user.email}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader>
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ClipboardCheckIcon className="size-5" />
            </div>

            <CardTitle className="mt-3 text-lg">Lengkapi Data Pasien</CardTitle>

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
              redirectTo="/client/dashboard"
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="h-fit">
            <CardHeader>
              <div className="flex size-9 items-center justify-center rounded-lg border bg-muted">
                <ShieldCheckIcon className="size-4" />
              </div>

              <CardTitle className="mt-2 text-base">Data Anda aman</CardTitle>

              <CardDescription>
                Profil menghubungkan akun Anda dengan rekam medis di klinik.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Nomor rekam medis (MRN) dibuat otomatis oleh sistem. Booking
                online dan antrian memerlukan profil yang terhubung.
              </p>

              <p>
                Jika data Anda sudah terdaftar di klinik, gunakan NIK yang sama
                agar tidak terjadi duplikasi.
              </p>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <div className="flex size-9 items-center justify-center rounded-lg border bg-muted">
                <SparklesIcon className="size-4" />
              </div>

              <CardTitle className="mt-2 text-base">
                Setelah profil lengkap
              </CardTitle>

              <CardDescription>
                Anda dapat langsung membuat booking dan memantau antrian.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </OnboardingShell>
  )
}

function OnboardingShell({
  email,
  children,
}: {
  email: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-svh bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ClipboardCheckIcon className="size-4" />
            </div>

            <div className="leading-tight">
              <p className="text-sm font-semibold">KIYU</p>

              <p className="text-xs text-muted-foreground">Portal Pasien</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {email}
            </span>

            <form action={logout}>
              <Button type="submit" variant="outline" size="sm">
                <LogOutIcon />
                Keluar
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6 md:py-14">
        <div className="mb-8 text-center">
          <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
            Onboarding
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Selamat datang
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Satu langkah lagi sebelum Anda dapat menggunakan layanan.
          </p>
        </div>

        {children}
      </main>
    </div>
  )
}
