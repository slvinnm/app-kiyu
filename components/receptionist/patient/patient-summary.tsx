import { UserRoundIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"

import { formatDate, genderLabel } from "@/lib/reception/format"

import type { Patient } from "@/types/reception"

export function PatientSummary({
  patient,
  action,
}: {
  patient: Patient
  action?: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="flex items-start gap-3 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border">
          <UserRoundIcon className="size-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{patient.name}</p>

            {patient.mrn && <Badge variant="outline">{patient.mrn}</Badge>}
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            NIK {patient.nik ?? "-"}
          </p>

          {patient.phone && (
            <p className="mt-1 text-xs text-muted-foreground">
              {patient.phone}
            </p>
          )}
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </div>

      <div className="grid gap-4 border-t p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs text-muted-foreground">Tanggal Lahir</p>

          <p className="mt-1 text-sm font-medium">
            {formatDate(patient.date_of_birth)}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Jenis Kelamin</p>

          <p className="mt-1 text-sm font-medium">
            {genderLabel(patient.gender)}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Email</p>

          <p className="mt-1 truncate text-sm font-medium">
            {patient.email ?? "-"}
          </p>
        </div>
      </div>
    </div>
  )
}
