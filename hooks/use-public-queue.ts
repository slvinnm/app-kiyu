"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { DisplayApiError, fetchPublicQueue } from "@/lib/api/display"
import { clearDisplayDevice } from "@/lib/display/device"
import { getEcho, publicFacilityChannel } from "@/lib/echo"
import { PUBLIC_FACILITY_ID } from "@/lib/public-headers"

import type { PublicQueueStation } from "@/types/admin"

/**
 * Fallback polling interval. Only used while the WebSocket is NOT connected,
 * so a healthy socket means no periodic HTTP traffic at all.
 */
const POLL_INTERVAL_MS = 10_000

export type CalledTicketEvent = {
  /** Stable key so the same call is not announced twice by polling. */
  key: string
  queueNumber: string
  stationCode: string | null
  stationName: string | null
  departmentCode: string | null
  departmentName: string | null
  /** Monotonic counter so the popup restarts for a repeated payload. */
  nonce: number
}

type CalledPayload = {
  queue_number?: string
  station_code?: string | null
  station_name?: string | null
  department_code?: string | null
  department_name?: string | null
  called_at?: string | null
}

/**
 * Tracks the Echo/Pusher connection state. Echo's reverb connector wraps a
 * Pusher instance; guard everything so a different connector shape can never
 * crash the display.
 */
function bindConnectionState(
  echo: ReturnType<typeof getEcho>,
  onChange: (connected: boolean) => void
): () => void {
  if (!echo) {
    return () => {}
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const connection = (echo as any)?.connector?.pusher?.connection

  if (!connection) {
    // Unknown shape: keep polling at the slow fallback interval.
    onChange(false)
    return () => {}
  }

  const handler = (states: { current?: string } | string) => {
    const current = typeof states === "string" ? states : states?.current
    onChange(current === "connected")
  }

  connection.bind?.("state_change", handler)
  onChange(connection.state === "connected")

  return () => {
    connection.unbind?.("state_change", handler)
  }
}

export function usePublicQueue() {
  const [stations, setStations] = useState<PublicQueueStation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)
  const [calledEvent, setCalledEvent] = useState<CalledTicketEvent | null>(null)

  const mountedRef = useRef(true)
  const inFlightRef = useRef(false)
  const seenCallsRef = useRef<Set<string>>(new Set())
  const initializedRef = useRef(false)
  const nonceRef = useRef(0)
  const connectedRef = useRef(false)

  const announceCall = useCallback(
    (
      queueNumber: string | undefined,
      stationCode: string | null | undefined,
      stationName: string | null | undefined,
      departmentCode: string | null | undefined,
      departmentName: string | null | undefined,
      calledAt: string | null | undefined,
      force = false
    ) => {
      if (!queueNumber) {
        return
      }

      const stamp = (calledAt ?? "").slice(0, 16)
      const key = `${stationCode ?? "-"}:${queueNumber}:${stamp}`

      // Polling dedupes by ticket+time; a real broadcast (force) always shows
      // the popup again, even for a recall of the same ticket.
      if (!force && seenCallsRef.current.has(key)) {
        return
      }

      seenCallsRef.current.add(key)
      nonceRef.current += 1

      setCalledEvent({
        key,
        queueNumber,
        stationCode: stationCode ?? null,
        stationName: stationName ?? null,
        departmentCode: departmentCode ?? null,
        departmentName: departmentName ?? null,
        nonce: nonceRef.current,
      })
    },
    []
  )

  const dismissCalled = useCallback(() => {
    setCalledEvent(null)
  }, [])

  const load = useCallback(async () => {
    if (inFlightRef.current) {
      return
    }

    inFlightRef.current = true

    try {
      const data = await fetchPublicQueue()

      if (!mountedRef.current) {
        return
      }

      setStations(data)
      setError(null)
      setLastUpdatedAt(new Date())

      // Polling fallback: detect newly-called tickets even without a socket.
      const currentCalls = data.filter((station) => station.current_calling)

      if (!initializedRef.current) {
        for (const station of currentCalls) {
          const ticket = station.current_calling!
          seenCallsRef.current.add(
            `${station.station_code}:${ticket.queue_number}:${(ticket.called_at ?? "").slice(0, 16)}`
          )
        }

        initializedRef.current = true
      } else {
        for (const station of currentCalls) {
          const ticket = station.current_calling!
          announceCall(
            ticket.queue_number,
            station.station_code,
            station.station_name,
            station.department_code,
            station.department_name,
            ticket.called_at
          )
        }
      }
    } catch (cause) {
      if (!mountedRef.current) {
        return
      }

      // A revoked or expired display credential means this screen must pair
      // again. Drop the stored credential and reload into onboarding.
      if (cause instanceof DisplayApiError && cause.status === 403) {
        clearDisplayDevice()
        window.location.reload()
        return
      }

      setError(
        cause instanceof Error ? cause.message : "Gagal memuat antrian publik."
      )
    } finally {
      inFlightRef.current = false

      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [announceCall])

  // WebSocket: instant refresh + popup whenever a ticket is called or recalled.
  useEffect(() => {
    const echo = getEcho()

    if (!echo) {
      return
    }

    const channel = echo.channel(publicFacilityChannel(PUBLIC_FACILITY_ID))

    const handler = (payload: CalledPayload) => {
      announceCall(
        payload?.queue_number,
        payload?.station_code,
        payload?.station_name ?? null,
        payload?.department_code,
        payload?.department_name ?? null,
        payload?.called_at,
        true
      )

      void load()
    }

    channel.listen(".queue.called", handler)

    const unbind = bindConnectionState(echo, (connected) => {
      const wasConnected = connectedRef.current
      connectedRef.current = connected

      // On (re)connect, refresh once so we catch anything missed offline.
      if (connected && !wasConnected) {
        void load()
      }
    })

    return () => {
      channel.stopListening(".queue.called")
      echo.leaveChannel(publicFacilityChannel(PUBLIC_FACILITY_ID))
      unbind()
    }
  }, [load, announceCall])

  // Fallback polling only while the socket is unavailable.
  useEffect(() => {
    mountedRef.current = true

    void load()

    const interval = window.setInterval(() => {
      if (document.visibilityState !== "visible" || connectedRef.current) {
        return
      }

      void load()
    }, POLL_INTERVAL_MS)

    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && !connectedRef.current) {
        void load()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      mountedRef.current = false
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [load])

  return { stations, loading, error, lastUpdatedAt, calledEvent, dismissCalled }
}
