"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { DisplayShell } from "@/components/display/display-shell"

import { usePublicQueue } from "@/hooks/use-public-queue"

import { stationTypeLabel } from "@/lib/reception/format"

export function DepartmentDisplay({ departmentCode }: { departmentCode: string }) {
  const router = useRouter()
  const { stations, loading, error, lastUpdatedAt } = usePublicQueue()

  const filtered = useMemo(
    () =>
      stations.filter(
        (station) =>
          (station.department_code ?? "").toLowerCase() ===
          departmentCode.toLowerCase()
      ),
    [stations, departmentCode]
  )

  const departmentName = filtered[0]?.department_name ?? departmentCode
  const totalWaiting = filtered.reduce(
    (total, station) => total + station.waiting_count,
    0
  )

  return (
    <DisplayShell
      title={departmentName}
      subtitle="Status dan ringkasan antrian departemen"
      lastUpdatedAt={lastUpdatedAt}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/display")}
          className="border-white/20 bg-transparent text-neutral-300 hover:bg-white/10 hover:text-white"
        >
          <ArrowLeftIcon />
          Semua Departemen
        </Button>

        <Badge variant="outline" className="border-white/20 text-neutral-300">
          Total menunggu: {totalWaiting}
        </Badge>
      </div>

      {error && filtered.length === 0 ? (
        <div className="flex min-h-[50vh] items-center justify-center text-center">
          <p className="text-lg text-neutral-400">{error}</p>
        </div>
      ) : loading && filtered.length === 0 ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-lg text-neutral-400">Memuat antrian...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-lg text-neutral-400">
            Tidak ada station untuk departemen ini.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((station) => (
            <div
              key={station.station_id}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] text-neutral-400 uppercase">
                    {station.station_code}
                  </p>

                  <h2 className="mt-1 text-xl font-bold tracking-tight">
                    {station.station_name}
                  </h2>
                </div>

                <Badge
                  variant="outline"
                  className="border-white/20 text-neutral-300"
                >
                  {stationTypeLabel(station.station_type)}
                </Badge>
              </div>

              <div className="mt-6 rounded-xl border border-white/10 p-5 text-center">
                <p className="text-xs font-medium tracking-[0.18em] text-neutral-400 uppercase">
                  Sedang Dipanggil
                </p>

                {station.current_calling ? (
                  <>
                    <p className="mt-2 text-6xl font-black tracking-tight text-emerald-400 tabular-nums">
                      {station.current_calling.queue_number}
                    </p>

                    <p className="mt-1 text-xs text-neutral-500">
                      {station.current_calling.status === "IN_PROGRESS"
                        ? "Sedang dilayani"
                        : "Dipanggil"}
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-5xl font-black text-neutral-600">—</p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium tracking-[0.18em] text-neutral-400 uppercase">
                    Menunggu
                  </p>

                  <p className="mt-1 text-3xl font-bold tabular-nums">
                    {station.waiting_count}
                  </p>
                </div>

                <div className="flex max-w-[60%] flex-wrap justify-end gap-1">
                  {station.upcoming_queue_numbers.map((number) => (
                    <span
                      key={number}
                      className="rounded-md border border-white/15 px-2 py-1 font-mono text-xs text-neutral-300"
                    >
                      {number}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DisplayShell>
  )
}
