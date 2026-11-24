import { UserRoundIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"

import { PatientLoadError } from "@/components/client/client-notices"
import { PatientProfileForm } from "@/components/client/profile-form"

import { getApiErrorMessage } from "@/lib/api/error"
import { getCurrentClientServer } from "@/lib/api/clients-server"

export default async function Page() {
  let current

  try {
    current = await getCurrentClientServer()
  } catch (cause) {
    return (
      <div className="mx-auto w-full max-w-6xl p-4 md:p-6 lg:p-8">
        <PageHeader />

        <PatientLoadError
          message={getApiErrorMessage(cause, "Gagal memuat profil pasien.")}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-6 lg:p-8">
      <PageHeader />

      <div className="mt-6">
        <PatientProfileForm
          userId={current.user.id}
          profile={current.profile}
        />
      </div>
    </div>
  )
}

function PageHeader() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Badge variant="outline">Pasien</Badge>

        <span className="text-xs text-muted-foreground">Profil</span>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <UserRoundIcon className="size-5" />
        </div>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Profil</h1>

          <p className="text-sm text-muted-foreground">
            Kelola identitas dan kontak profil pasien Anda.
          </p>
        </div>
      </div>
    </div>
  )
}
