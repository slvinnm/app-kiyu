import { ListOrderedIcon } from "lucide-react"

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
  onProcess,
}: {
  ticket: QueueTicket
  index: number
  onProcess?: (ticket: QueueTicket) => void
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
          {ticket.visit?.client?.name ?? "Walk-in — belum teridentifikasi"}
        </p>

        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{ticket.visit?.visit_number ?? "-"}</span>

          <span>{ticket.workflow_step?.name ?? "-"}</span>

          {ticket.visit && (
            <span>{channelLabel(ticket.visit.intake_channel)}</span>
          )}
        </div>
      </div>

      {onProcess && (
        <Button
          size="sm"
          variant="outline"
          className="shrink-0"
          onClick={() => onProcess(ticket)}
        >
          Proses
        </Button>
      )}
    </div>
  )
}

export function WaitingList({
  tickets,
  onHold,
  onProcess,
}: {
  tickets: QueueTicket[]
  onHold: QueueTicket[]
  onProcess?: (ticket: QueueTicket) => void
}) {
  return (
    <div className="space-y-4">
      <Card className="h-fit">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Antrian Menunggu</CardTitle>

              <CardDescription>
                Daftar pasien yang siap dipanggil ke meja registrasi.
              </CardDescription>
            </div>

            <Badge variant="outline">{tickets.length}</Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {tickets.length > 0 ? (
            <div>
              {tickets.map((ticket, index) => (
                <TicketRow
                  key={ticket.id}
                  ticket={ticket}
                  index={index}
                  onProcess={onProcess}
                />
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
                  Antrian yang sedang ditahan di meja registrasi.
                </CardDescription>
              </div>

              <Badge variant="outline">{onHold.length}</Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {onHold.map((ticket, index) => (
              <TicketRow key={ticket.id} ticket={ticket} index={index} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
