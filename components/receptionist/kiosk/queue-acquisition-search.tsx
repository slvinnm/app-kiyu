import { CheckIcon, SearchIcon, SearchXIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import type { QueueAcquisition } from "@/types/reception"

type QueueAcquisitionSearchProps = {
  search: string
  results: QueueAcquisition[]
  selected: QueueAcquisition | null
  searching: boolean
  onSearchChange: (value: string) => void
  onSelect: (acquisition: QueueAcquisition) => void
}

export function QueueAcquisitionSearch({
  search,
  results,
  selected,
  searching,
  onSearchChange,
  onSelect,
}: QueueAcquisitionSearchProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold tracking-tight">
          Cari Queue Acquisition
        </CardTitle>

        <CardDescription className="text-xs text-muted-foreground">
          Cari berdasarkan ID acquisition, nomor visit, atau nomor antrian.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Ketik ID / No. Visit / No. Antrian..."
            className="h-10 pr-9 pl-9 text-sm"
            autoFocus
          />

          {searching && (
            <Spinner className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
          )}
        </div>

        {results.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                Hasil Pencarian ({results.length})
              </p>
            </div>

            <div className="space-y-2">
              {results.map((acquisition) => {
                const isSelected = selected?.id === acquisition.id

                return (
                  <button
                    key={acquisition.id}
                    type="button"
                    onClick={() => onSelect(acquisition)}
                    className={`group relative w-full rounded-lg border p-3.5 text-left transition-all hover:border-foreground/30 hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                      isSelected
                        ? "border-foreground bg-muted/60 shadow-sm"
                        : "bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-20 shrink-0 items-center justify-center rounded-md border bg-muted/40 font-mono text-base font-bold text-foreground group-hover:bg-background">
                          {acquisition.queue_ticket?.queue_number ?? "-"}
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {acquisition.department?.name ??
                              "Departemen tidak ditentukan"}
                          </p>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-mono">
                              Visit: {acquisition.visit?.visit_number ?? "-"}
                            </span>
                            <span>•</span>
                            <span className="font-mono">#{acquisition.id}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-[11px] font-medium capitalize"
                        >
                          {acquisition.status ?? "-"}
                        </Badge>

                        {isSelected && (
                          <div className="flex size-5 items-center justify-center rounded-full bg-foreground text-background">
                            <CheckIcon className="size-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {search && !searching && results.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 p-8 text-center">
            <div className="mb-2 flex size-10 items-center justify-center rounded-full border bg-muted text-muted-foreground">
              <SearchXIcon className="size-5" />
            </div>

            <p className="text-sm font-medium text-foreground">
              Queue acquisition tidak ditemukan
            </p>

            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Tidak ada hasil untuk kata kunci &quot;{search}&quot;. Periksa
              kembali ID, nomor visit, atau nomor antrian.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
