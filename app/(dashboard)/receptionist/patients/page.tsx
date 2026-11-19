import { UsersIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"

import { PatientDirectory } from "@/components/receptionist/patients/patient-directory"

export default function Page() {
  return (
    <div className="mx-auto w-full p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Reception</Badge>

          <span className="text-xs text-muted-foreground">
            Patient Directory
          </span>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UsersIcon className="size-5" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Pasien</h1>

            <p className="text-sm text-muted-foreground">
              Cari data pasien dan lihat riwayat kunjungannya.
            </p>
          </div>
        </div>
      </div>

      <PatientDirectory />
    </div>
  )
}
