"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { bindEchoConnectionState, getEcho, publicFacilityChannel } from "@/lib/echo"

/**
 * Re-runs the enclosing server component whenever a queue channel changes.
 * Used by server-rendered dashboards so their figures stay live without a
 * manual refresh button.
 *
 * The channel is the facility-scoped public one (`public.facility.{id}`), which
 * is what the API broadcasts. The tenant-scoped department/station channels are
 * private and require the Sanctum token, which lives in an HttpOnly cookie the
 * browser cannot read — so they are not reachable from here. A facility feed is
 * slightly broader (it also carries other stations' changes), which costs one
 * extra refetch per event and leaks nothing: no PII is broadcast.
 */
export function LiveRefresh({
  facilityId,
  stationId,
}: {
  facilityId?: number | null
  stationId?: number | null
}) {
  const router = useRouter()

  useEffect(() => {
    const echo = getEcho()

    if (!echo || !facilityId) {
      return
    }

    const name = publicFacilityChannel(facilityId)

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

    echo.channel(name).listen(".queue.updated", scheduleRefresh)
    echo.channel(name).listen(".queue.called", scheduleRefresh)

    const unbind = bindEchoConnectionState(echo, (connected) => {
      if (connected) {
        scheduleRefresh()
      }
    })

    // `stationId` is kept in the dependency list because a station change
    // remounts the page's data anyway; the channel itself does not vary by it.
    void stationId

    return () => {
      if (timer !== null) window.clearTimeout(timer)

      echo.channel(name).stopListening(".queue.updated", scheduleRefresh)
      echo.channel(name).stopListening(".queue.called", scheduleRefresh)

      unbind()
    }
  }, [facilityId, stationId, router])

  return null
}
