"use client"

import { useEffect, useState } from "react"
import { Clock3 } from "lucide-react"

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date)
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

export function KioskClock() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    const update = () => {
      setNow(new Date())
    }

    update()

    const timer = window.setInterval(update, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [])

  return (
    <>
      <div className="hidden text-right sm:block">
        <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums md:text-3xl">
          {now ? formatTime(now) : "--:--:--"}
        </div>

        <div className="mt-1 text-sm font-medium text-muted-foreground capitalize">
          {now ? formatDate(now) : "Memuat waktu..."}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 rounded-2xl bg-card px-4 py-3 shadow-sm sm:hidden">
        <Clock3 className="size-4 text-muted-foreground" />

        <span className="font-bold text-foreground tabular-nums">
          {now ? formatTime(now) : "--:--:--"}
        </span>

        <span className="text-border">•</span>

        <span className="text-sm text-muted-foreground capitalize">
          {now ? formatDate(now) : "Memuat waktu..."}
        </span>
      </div>
    </>
  )
}
