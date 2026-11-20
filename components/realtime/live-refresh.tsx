"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { bindEchoConnectionState, getEcho } from "@/lib/echo"

/**
 * Re-runs the enclosing server component whenever a queue channel changes.
 * Used by server-rendered dashboards so their figures stay live without a
 * manual refresh button.
 */
export function LiveRefresh({
  departmentId,
  stationId,
}: {
  departmentId?: number | null
  stationId?: number | null
}) {
  const router = useRouter()

  useEffect(() => {
    const echo = getEcho()

    if (!echo) {
      return
    }

    const channels: string[] = []

    if (departmentId) channels.push(`department.${departmentId}`)
    if (stationId) channels.push(`station.${stationId}`)

    if (channels.length === 0) {
      return
    }

    let timer: number | null = null
    let first = true

    const scheduleRefresh = () => {
      if (first) {
        first = false
        return
      }

      if (timer !== null) {
        window.clearTimeout(timer)
      }

      // Coalesce bursts of updates into one refresh.
      timer = window.setTimeout(() => {
        router.refresh()
      }, 400)
    }

    for (const name of channels) {
      echo.channel(name).listen(".queue.updated", scheduleRefresh)
      echo.channel(name).listen(".queue.called", scheduleRefresh)
    }

    const unbind = bindEchoConnectionState(echo, (connected) => {
      if (connected) {
        scheduleRefresh()
      }
    })

    return () => {
      if (timer !== null) window.clearTimeout(timer)

      for (const name of channels) {
        echo.channel(name).stopListening(".queue.updated", scheduleRefresh)
        echo.channel(name).stopListening(".queue.called", scheduleRefresh)
      }

      unbind()
    }
  }, [departmentId, stationId, router])

  return null
}
