import {
  BellRingIcon,
  CheckCircle2Icon,
  CirclePauseIcon,
  LoaderCircleIcon,
  UsersIcon,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

function StatCard({
  label,
  value,
  icon,
}: {
  label: string
  value: number
  icon: React.ReactNode
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border text-muted-foreground">
          {icon}
        </div>

        <div>
          <p className="text-xs text-muted-foreground">{label}</p>

          <p className="text-xl font-semibold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function ClinicalStats({
  waiting,
  called,
  inProgress,
  onHold,
}: {
  waiting: number
  called: number
  inProgress: number
  onHold: number
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Menunggu"
        value={waiting}
        icon={<UsersIcon className="size-4" />}
      />

      <StatCard
        label="Dipanggil"
        value={called}
        icon={<BellRingIcon className="size-4" />}
      />

      <StatCard
        label="Sedang Dilayani"
        value={inProgress}
        icon={<LoaderCircleIcon className="size-4" />}
      />

      <StatCard
        label="Ditahan"
        value={onHold}
        icon={<CirclePauseIcon className="size-4" />}
      />
    </div>
  )
}

export function ClinicalCompletedBadge({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <CheckCircle2Icon className="size-4" />
      {count} layanan selesai hari ini
    </div>
  )
}
