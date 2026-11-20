"use client"

import { useMemo } from "react"

import { Badge } from "@/components/ui/badge"

import { DisplayShell } from "@/components/display/display-shell"

import { usePublicQueue } from "@/hooks/use-public-queue"

import type { PublicQueueStation } from "@/types/admin"

type DepartmentSummary = {
  code: string
  name: string
  waiting: number
  stations: PublicQueueStation[]
  calling: string[]
}

function summarize(stations: PublicQueueStation[]): DepartmentSummary[] {
  const map = new Map<string, DepartmentSummary>()

  for (const station of stations) {
    const key = station.department_code ?? String(station.department_id)
    const entry =
      map.get(key) ??
      ({
        code: station.department_code ?? "-",
        name: station.department_name ?? "Departemen",
        waiting: 0,
        stations: [],
        calling: [],
      } satisfies DepartmentSummary)

    entry.waiting += station.waiting_count
    entry.stations.push(station)

    if (station.current_calling) {
      entry.calling.push(station.current_calling.queue_number)
    }

    map.set(key, entry)
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
}

export function PublicDisplay() {
  const { stations, loading, error, lastUpdatedAt } = usePublicQueue()

  const departments = useMemo(() => summarize(stations), [stations])

  return (
    <DisplayShell
      title="Antrian Layanan"
      subtitle="Ringkasan antrian seluruh departemen"
      lastUpdatedAt={lastUpdatedAt}
    >
      {error && stations.length === 0 ? (
        <div className="flex min-h-[50vh] items-center justify-center text-center">
          <p className="text-lg text-neutral-400">{error}</p>
        </div>
      ) : loading && stations.length === 0 ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-lg text-neutral-400">Memuat antrian...</p>
        </div>
      ) : departments.length === 0 ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-lg text-neutral-400">
            Belum ada station aktif.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {departments.map((department) => (
            <div
              key={department.code}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] text-neutral-400 uppercase">
                    {department.code}
                  </p>

                  <h2 className="mt-1 text-2xl font-bold tracking-tight">
                    {department.name}
                  </h2>
                </div>

                <Badge
                  variant="outline"
                  className="border-white/20 text-neutral-300"
                >
                  {department.stations.length} station
                </Badge>
              </div>

              <div className="mt-6">
                <p className="text-xs font-medium tracking-[0.18em] text-neutral-400 uppercase">
                  Sedang Dipanggil
                </p>

                {department.calling.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {department.calling.map((number) => (
                      <span
                        key={number}
                        className="rounded-xl bg-emerald-500 px-4 py-2 text-4xl font-black tracking-tight text-neutral-950 tabular-nums"
                      >
                        {number}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-3xl font-bold text-neutral-600">—</p>
                )}
              </div>

              <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-4">
                <div>
                  <p className="text-xs font-medium tracking-[0.18em] text-neutral-400 uppercase">
                    Menunggu
                  </p>

                  <p className="mt-1 text-4xl font-bold tabular-nums">
                    {department.waiting}
                  </p>
                </div>

                <div className="flex flex-wrap justify-end gap-1">
                  {department.stations
                    .flatMap((station) => station.upcoming_queue_numbers)
                    .slice(0, 4)
                    .map((number) => (
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
