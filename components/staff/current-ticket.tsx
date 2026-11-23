import {
  BellRingIcon,
  CheckCircle2Icon,
  CirclePauseIcon,
  EllipsisIcon,
  MegaphoneIcon,
  PlayIcon,
  SkipForwardIcon,
  UserRoundIcon,
  XCircleIcon,
  ArrowRightLeftIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  channelLabel,
  formatTime,
  priorityLabel,
  ticketStatusLabel,
} from "@/lib/reception/format"

import type { QueueTicket } from "@/types/reception"

export function StaffCurrentTicket({
  ticket,
  processing,
  canCallNext,
  onCallNext,
  onStart,
  onHold,
  onComplete,
  onRecall,
  onSkip,
  onNoShow,
  onCancel,
  onTransfer,
}: {
  ticket: QueueTicket | null
  processing: boolean
  canCallNext: boolean
  onCallNext: () => void
  onStart: (ticket: QueueTicket) => void
  onHold: (ticket: QueueTicket) => void
  onComplete: (ticket: QueueTicket) => void
  onRecall: (ticket: QueueTicket) => void
  onSkip: (ticket: QueueTicket) => void
  onNoShow: (ticket: QueueTicket) => void
  onCancel: (ticket: QueueTicket) => void
  onTransfer: (ticket: QueueTicket) => void
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">Pasien Saat Ini</CardTitle>

            <CardDescription>
              Pasien yang sedang ditangani di station ini.
            </CardDescription>
          </div>

          {ticket && (
            <Badge variant="outline">{ticketStatusLabel(ticket.status)}</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {!ticket ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
            <div className="flex size-14 items-center justify-center rounded-full border">
              <MegaphoneIcon className="size-6" />
            </div>

            <h2 className="mt-5 text-xl font-semibold">
              Tidak ada pasien aktif
            </h2>

            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Panggil antrian berikutnya untuk memulai pelayanan.
            </p>

            <Button
              size="lg"
              className="mt-6 min-w-52"
              onClick={onCallNext}
              disabled={!canCallNext || processing}
            >
              <BellRingIcon />
              {processing ? "Memanggil..." : "Panggil Berikutnya"}
            </Button>

            {!canCallNext && !processing && (
              <p className="mt-3 text-xs text-muted-foreground">
                Tidak ada antrian yang siap dipanggil.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-xl border p-8 text-center">
              <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                Nomor Antrian
              </p>

              <p className="mt-3 text-7xl font-bold tracking-tight tabular-nums">
                {ticket.queue_number}
              </p>

              <p className="mt-3 text-sm text-muted-foreground">
                {ticket.visit?.visit_number ?? "-"}
              </p>
            </div>

            <div className="rounded-xl border p-5">
              <div className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border">
                  <UserRoundIcon className="size-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Pasien</p>

                  <p className="mt-1 text-lg font-semibold">
                    {ticket.visit?.client?.name ??
                      "Pasien belum teridentifikasi"}
                  </p>

                  {ticket.visit?.client?.mrn && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {ticket.visit.client.mrn}
                    </p>
                  )}
                </div>

                <Badge variant="outline" className="ml-auto shrink-0">
                  {priorityLabel(ticket.priority)}
                </Badge>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Langkah</p>

                <p className="mt-1 text-sm font-medium">
                  {ticket.workflow_step?.name ?? "-"}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Channel</p>

                <p className="mt-1 text-sm font-medium">
                  {ticket.visit
                    ? channelLabel(ticket.visit.intake_channel)
                    : "-"}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  {ticket.status === "IN_PROGRESS" ? "Mulai" : "Dipanggil"}
                </p>

                <p className="mt-1 text-sm font-medium">
                  {formatTime(
                    ticket.status === "IN_PROGRESS"
                      ? ticket.started_at
                      : ticket.called_at
                  )}
                </p>
              </div>
            </div>

            <div className="space-y-3 border-t pt-5">
              {ticket.status === "CALLED" && (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => onStart(ticket)}
                  disabled={processing}
                >
                  <PlayIcon />
                  Mulai Pelayanan
                </Button>
              )}

              {ticket.status === "IN_PROGRESS" && (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => onComplete(ticket)}
                  disabled={processing}
                >
                  <CheckCircle2Icon />
                  Selesaikan Pelayanan
                </Button>
              )}

              <div className="grid gap-2 sm:grid-cols-3">
                {ticket.status === "CALLED" && (
                  <Button
                    variant="outline"
                    onClick={() => onRecall(ticket)}
                    disabled={processing}
                  >
                    <BellRingIcon />
                    Panggil Ulang
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => onHold(ticket)}
                  disabled={processing}
                >
                  <CirclePauseIcon />
                  Tahan
                </Button>

                <Button
                  variant="outline"
                  onClick={() => onTransfer(ticket)}
                  disabled={processing}
                >
                  <ArrowRightLeftIcon />
                  Transfer
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={<Button variant="outline" className="w-full" />}
                    disabled={processing}
                  >
                    <EllipsisIcon />
                    Tindakan Lain
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onSkip(ticket)}>
                      <SkipForwardIcon />
                      Lewati
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => onNoShow(ticket)}>
                      <XCircleIcon />
                      Tidak Hadir
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => onCancel(ticket)}>
                      <XCircleIcon />
                      Batalkan
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
