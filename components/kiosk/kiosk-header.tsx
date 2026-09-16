import { MonitorSmartphone } from "lucide-react"

import { KioskClock } from "@/components/kiosk/kiosk-clock"
import { ModeToggle } from "@/components/kiosk/mode-toggle"

export function KioskHeader() {
  return (
    <header className="mb-7">
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <MonitorSmartphone className="size-6" />
          </div>

          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              ANJUNGAN
            </p>

            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Pengambilan Nomor Antrean
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <KioskClock />
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
