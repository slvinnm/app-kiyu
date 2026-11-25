import { Check, Clock3, MapPin, Repeat2 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/visit-tracking/status-badge"

import type { VisitTrackingData } from "@/types/visit-tracking"

type VisitJourneyProps = {
  journey: VisitTrackingData["journey"]
}

function formatDateTime(value: string | null) {
  if (!value) return null

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function VisitJourney({ journey }: VisitJourneyProps) {
  if (journey.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Perjalanan kunjungan</CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground">
            Belum ada alur layanan yang tersedia untuk kunjungan ini.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Perjalanan kunjungan</CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              Tahapan layanan berdasarkan alur kunjungan.
            </p>
          </div>

          <span className="shrink-0 rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {journey.length} tahap
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        <div className="space-y-0">
          {journey.map((item, index) => {
            const isCompleted = item.status === "COMPLETED"
            const isCurrent = item.is_current
            const isSkipped = item.status === "SKIPPED"

            return (
              <div
                key={item.step.id}
                className="relative flex gap-4 pb-7 last:pb-0"
              >
                {index !== journey.length - 1 && (
                  <div className="absolute top-9 bottom-0 left-[15px] w-px bg-border" />
                )}

                <div
                  className={[
                    "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border",
                    isCompleted
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                      : isCurrent
                        ? "border-primary bg-primary text-primary-foreground"
                        : isSkipped
                          ? "border-muted bg-muted text-muted-foreground"
                          : "border-border bg-background text-muted-foreground",
                  ].join(" ")}
                >
                  {isCompleted ? (
                    <Check className="size-4" />
                  ) : isCurrent ? (
                    <Clock3 className="size-4" />
                  ) : (
                    <span className="text-xs font-semibold">{index + 1}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold">
                          {item.step.name}
                        </h3>

                        {item.step.is_optional && (
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            Opsional
                          </span>
                        )}

                        {item.step.is_repeatable && (
                          <Repeat2 className="size-3.5 text-muted-foreground" />
                        )}

                        {isCurrent && (
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                            Tahap saat ini
                          </span>
                        )}
                      </div>

                      {item.step.station && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="size-3.5 shrink-0" />
                          <span>{item.step.station.name}</span>
                        </div>
                      )}
                    </div>

                    <StatusBadge status={item.status} />
                  </div>

                  {item.tickets.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {item.tickets.map((ticket, ticketIndex) => (
                        <div
                          key={`${item.step.id}-${ticket.queue_number}-${ticketIndex}`}
                          className={[
                            "rounded-lg border p-3",
                            ticket.is_current
                              ? "border-primary/30 bg-primary/[0.03]"
                              : "bg-muted/30",
                          ].join(" ")}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                Nomor antrean
                              </span>

                              <span className="font-mono text-sm font-semibold">
                                {ticket.queue_number}
                              </span>
                            </div>

                            <StatusBadge status={ticket.status} />
                          </div>

                          {ticket.transferred_to && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              Dialihkan ke{" "}
                              <span className="font-medium text-foreground">
                                {ticket.transferred_to.name}
                              </span>
                            </div>
                          )}

                          {ticket.timestamps.completed_at && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Selesai:{" "}
                              {formatDateTime(ticket.timestamps.completed_at)}
                            </p>
                          )}

                          {ticket.is_current && (
                            <p className="mt-2 text-xs font-medium text-primary">
                              Antrean aktif saat ini
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Belum ada aktivitas antrean pada tahap ini.
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
