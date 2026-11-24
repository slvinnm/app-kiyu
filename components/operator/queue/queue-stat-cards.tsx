import {
  BellRingIcon,
  CheckCircle2Icon,
  CirclePauseIcon,
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

export function QueueStatCards({
  waitingCount,
  currentCalling,
  calledToday,
  onHoldCount,
}: {
  waitingCount: number
  currentCalling: boolean
  calledToday: number
  onHoldCount: number
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Menunggu"
        value={waitingCount}
        icon={<UsersIcon className="size-4" />}
      />

      <StatCard
        label="Sedang Dipanggil"
        value={currentCalling ? 1 : 0}
        icon={<BellRingIcon className="size-4" />}
      />

      <StatCard
        label="Dipanggil Hari Ini"
        value={calledToday}
        icon={<CheckCircle2Icon className="size-4" />}
      />

      <StatCard
        label="Ditahan"
        value={onHoldCount}
        icon={<CirclePauseIcon className="size-4" />}
      />
    </div>
  )
}
