import { ListOrderedIcon, RotateCcwIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { channelLabel, priorityLabel } from "@/lib/reception/format"

import type { QueueTicket } from "@/types/reception"

function TicketRow({
  ticket,
  index,
  action,
}: {
  ticket: QueueTicket
  index: number
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 border-t p-4">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md border text-xs font-medium tabular-nums">
        {index + 1}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{ticket.queue_number}</span>

          {ticket.priority !== 1 && (
            <Badge variant="outline" className="text-[10px]">
              {priorityLabel(ticket.priority)}
            </Badge>
          )}
        </div>

        <p className="mt-1 truncate text-sm">
          {ticket.visit?.client?.name ?? "Pasien belum teridentifikasi"}
        </p>

        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{ticket.visit?.visit_number ?? "-"}</span>

          <span>{ticket.workflow_step?.name ?? "-"}</span>

          {ticket.visit && (
            <span>{channelLabel(ticket.visit.intake_channel)}</span>
          )}
        </div>
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function StaffLists({
  waiting,
  called,
  onHold,
  currentTicketId,
  processing,
  focusDisabled,
  onResume,
  onFocus,
}: {
  waiting: QueueTicket[]
  called: QueueTicket[]
  onHold: QueueTicket[]
  currentTicketId: number | null
  processing: boolean
  focusDisabled?: boolean
  onResume: (ticket: QueueTicket) => void
  onFocus: (ticket: QueueTicket) => void
}) {
  return (
    <div className="space-y-4">
      {called.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Dipanggil</CardTitle>

                <CardDescription>
                  Pasien yang sudah dipanggil dan siap ditangani.
                </CardDescription>
              </div>

              <Badge variant="outline">{called.length}</Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {called.map((ticket, index) => (
              <TicketRow
                key={ticket.id}
                ticket={ticket}
                index={index}
                action={
                  ticket.id === currentTicketId ? (
                    <Badge variant="secondary">Aktif</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onFocus(ticket)}
                      disabled={processing || focusDisabled}
                    >
                      Tangani
                    </Button>
                  )
                }
              />
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="h-fit">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Antrian Menunggu</CardTitle>

              <CardDescription>
                Pasien yang siap dipanggil di station ini.
              </CardDescription>
            </div>

            <Badge variant="outline">{waiting.length}</Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {waiting.length > 0 ? (
            <div>
              {waiting.map((ticket, index) => (
                <TicketRow key={ticket.id} ticket={ticket} index={index} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <ListOrderedIcon className="mx-auto size-6 text-muted-foreground" />

              <p className="mt-3 text-sm font-medium">Tidak ada antrian</p>

              <p className="mt-1 text-xs text-muted-foreground">
                Semua antrian sudah diproses.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {onHold.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Ditahan</CardTitle>

                <CardDescription>
                  Pasien yang ditahan dapat dilanjutkan kembali.
                </CardDescription>
              </div>

              <Badge variant="outline">{onHold.length}</Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {onHold.map((ticket, index) => (
              <TicketRow
                key={ticket.id}
                ticket={ticket}
                index={index}
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onResume(ticket)}
                    disabled={processing}
                  >
                    <RotateCcwIcon />
                    Lanjutkan
                  </Button>
                }
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
