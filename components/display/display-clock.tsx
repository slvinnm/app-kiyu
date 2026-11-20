"use client"

import { useEffect, useState } from "react"

export function DisplayClock() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    const update = () => setNow(new Date())
    update()
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [])

  const time = now
    ? new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(now)
    : "--:--"

  const date = now
    ? new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(now)
    : ""

  return (
    <div className="text-right">
      <p className="text-3xl font-bold tabular-nums md:text-4xl">{time}</p>
      <p className="text-sm text-muted-foreground capitalize">{date}</p>
    </div>
  )
}
