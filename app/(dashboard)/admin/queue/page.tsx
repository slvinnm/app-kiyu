import { ListOrdered } from "lucide-react"
import { redirect } from "next/navigation"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { AdminPageHeader } from "@/components/admin/admin-page-header"

import { getPublicQueueServer } from "@/lib/api/admin-server"
import { getApiErrorMessage } from "@/lib/api/error"
import { getSession } from "@/lib/auth/session"
import {
  stationTypeLabel,
  ticketStatusLabel,
} from "@/lib/reception/format"

import type { PublicQueueStation } from "@/types/admin"
import type { QueueTicketStatus } from "@/types/reception"

export default async function Page() {
  const session = await getSession()

  if (!session?.user?.role) {
    redirect("/login")
  }

  let stations: PublicQueueStation[] = []
  let error: string | null = null

  try {
    stations = await getPublicQueueServer()
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat antrian publik.")
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
      <AdminPageHeader
        title="Antrian"
        description="Monitoring antrian per station tanpa menampilkan data pribadi pasien."
        icon={<ListOrdered className="size-5" />}
      />

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Antrian tidak tersedia</AlertTitle>

          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : stations.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-52 flex-col items-center justify-center text-center">
            <ListOrdered className="size-7 text-muted-foreground" />

            <p className="mt-3 text-sm font-medium">
              Belum ada station aktif
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Antrian akan muncul setelah station aktif memiliki tiket.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stations.map((station) => (
            <Card key={station.station_id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base">
                      {station.station_name}
                    </CardTitle>

                    <CardDescription>
                      {station.department_name} · {station.station_code}
                    </CardDescription>
                  </div>

                  <Badge variant="outline" className="shrink-0">
                    {stationTypeLabel(station.station_type)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="rounded-xl border p-4 text-center">
                  <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                    Sedang Dipanggil
                  </p>

                  {station.current_calling ? (
                    <>
                      <p className="mt-1 text-3xl font-black tabular-nums">
                        {station.current_calling.queue_number}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {ticketStatusLabel(
                          station.current_calling
                            .status as QueueTicketStatus
                        )}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">-</p>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Menunggu</span>

                  <Badge variant="outline">{station.waiting_count}</Badge>
                </div>

                {station.upcoming_queue_numbers.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {station.upcoming_queue_numbers.map((number) => (
                      <Badge
                        key={number}
                        variant="secondary"
                        className="font-mono text-[10px]"
                      >
                        {number}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
