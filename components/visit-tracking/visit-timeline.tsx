import {
  Activity,
  ArrowLeftRight,
  CheckCircle2,
  Clock3,
  PauseCircle,
  PhoneCall,
  PlayCircle,
  SkipForward,
  Ticket,
  XCircle,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import type { VisitTrackingData } from "@/types/visit-tracking"

type VisitTimelineProps = {
  timeline: VisitTrackingData["timeline"]
}

const EVENT_ICONS = {
  CREATED: Ticket,
  CALLED: PhoneCall,
  RECALLED: PhoneCall,
  STARTED: PlayCircle,
  COMPLETED: CheckCircle2,
  HELD: PauseCircle,
  RESUMED: PlayCircle,
  SKIPPED: SkipForward,
  CANCELLED: XCircle,
  NO_SHOW: Clock3,
  TRANSFERRED: ArrowLeftRight,
} as const

function formatDateTime(value: string | null) {
  if (!value) return "Waktu tidak tersedia"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "Waktu tidak tersedia"

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function VisitTimeline({ timeline }: VisitTimelineProps) {
  return (
    <Card>
      <CardHeader className="border-b">
        <div>
          <CardTitle className="text-base">Aktivitas kunjungan</CardTitle>

          <p className="mt-1 text-sm text-muted-foreground">
            Riwayat perubahan antrean selama kunjungan.
          </p>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        {timeline.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
              <Activity className="size-5 text-muted-foreground" />
            </div>

            <p className="text-sm font-medium">Belum ada aktivitas</p>

            <p className="mt-1 max-w-56 text-xs text-muted-foreground">
              Aktivitas antrean akan muncul di sini setelah tersedia.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {timeline.map((event, index) => {
              const Icon =
                EVENT_ICONS[event.type as keyof typeof EVENT_ICONS] ?? Activity

              return (
                <div
                  key={`${event.type}-${event.queue_number}-${event.occurred_at}-${index}`}
                  className="flex gap-3"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-5 font-medium">
                      {event.message}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-mono">{event.queue_number}</span>

                      {event.station && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{event.station.name}</span>
                        </>
                      )}
                    </div>

                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      {formatDateTime(event.occurred_at)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
