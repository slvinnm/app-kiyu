"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { fetchPublicQueue } from "@/lib/api/display"
import { getEcho, PUBLIC_QUEUE_CHANNEL } from "@/lib/echo"

import type { PublicQueueStation } from "@/types/admin"

// Displays must react quickly when a ticket is called. Polling every 3s is a
// reliable fallback that works everywhere (WebSocket broadcasting can be added
// later without changing the consumer API).
const POLL_INTERVAL_MS = 3_000

export function usePublicQueue() {
  const [stations, setStations] = useState<PublicQueueStation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)

  const mountedRef = useRef(true)
  const inFlightRef = useRef(false)

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
    } catch (cause) {
      if (!mountedRef.current) {
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
  }, [])

  // Subscribe to Reverb broadcasts and refresh immediately when a ticket is
  // called. Falls back to polling below if the socket is unavailable.
  useEffect(() => {
    const echo = getEcho()

    if (!echo) {
      return
    }

    const channel = echo.channel(PUBLIC_QUEUE_CHANNEL)

    const handler = () => {
      void load()
    }

    channel.listen(".queue.called", handler)

    return () => {
      channel.stopListening(".queue.called")
      echo.leaveChannel(PUBLIC_QUEUE_CHANNEL)
    }
  }, [load])

  useEffect(() => {
    mountedRef.current = true

    void load()

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void load()
      }
    }, POLL_INTERVAL_MS)

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
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

  return { stations, loading, error, lastUpdatedAt }
}
