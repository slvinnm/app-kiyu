"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { getStationQueue } from "@/lib/api/staff"
import { getApiErrorMessage } from "@/lib/api/error"
import { bindEchoConnectionState, getEcho, publicFacilityChannel } from "@/lib/echo"
import { PUBLIC_FACILITY_ID } from "@/lib/public-headers"

import type { QueueTicket, Station } from "@/types/reception"

const POLL_INTERVAL_MS = 15_000

/**
 * Loads the operational queue for a clinical station and keeps it fresh while
 * the tab is visible. The station comes from the signed-in user's assignment.
 */
export function useStaffQueue(
  stationId: number | null,
  options?: { paused?: boolean; actorEmail?: string | null }
) {
  const paused = options?.paused ?? false
  const actorEmail = options?.actorEmail ?? null

  const [station, setStation] = useState<Station | null>(null)
  const [tickets, setTickets] = useState<QueueTicket[]>([])
  const [loading, setLoading] = useState(stationId !== null)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const mountedRef = useRef(true)
  const stationRef = useRef(stationId)
  const pausedRef = useRef(paused)
  const inFlightRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)
  const connectedRef = useRef(false)

  useEffect(() => {
    stationRef.current = stationId
  }, [stationId])

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
      abortRef.current?.abort()
    }
  }, [])

  const fetchQueue = useCallback(async () => {
    if (stationId === null || inFlightRef.current) {
      return
    }

    const requestedStation = stationId

    inFlightRef.current = true
    abortRef.current?.abort()

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const response = await getStationQueue(
        requestedStation,
        controller.signal
      )

      if (
        !mountedRef.current ||
        controller.signal.aborted ||
        stationRef.current !== requestedStation
      ) {
        return
      }

      setStation(response.station)
      setTickets(response.data)
      setError(null)
      setLastUpdatedAt(new Date())
    } catch (cause) {
      if (
        !mountedRef.current ||
        controller.signal.aborted ||
        stationRef.current !== requestedStation
      ) {
        return
      }

      setError(getApiErrorMessage(cause, "Gagal memuat antrian station."))
    } finally {
      // Only the latest request owns the in-flight flag. Without this guard a
      // StrictMode cleanup (which aborts the first request) can leave the flag
      // stuck and block the real fetch until the user refreshes.
      if (abortRef.current === controller) {
        abortRef.current = null
        inFlightRef.current = false
      }

      if (mountedRef.current && stationRef.current === requestedStation) {
        setLoading(false)
      }
    }
  }, [stationId])

  // Live updates: any change at this station (or its department) refetches.
  useEffect(() => {
    if (stationId === null) {
      setIsConnected(false)
      connectedRef.current = false
      return
    }

    const echo = getEcho()

    if (!echo) {
      setIsConnected(false)
      connectedRef.current = false
      return
    }

    const channels = [publicFacilityChannel(PUBLIC_FACILITY_ID)]

    const handler = () => {
      if (!pausedRef.current) {
        void fetchQueue()
      }
    }

    for (const name of channels) {
      echo.channel(name).listen(".queue.updated", handler)
    }

    const unbind = bindEchoConnectionState(echo, (connected) => {
      const wasConnected = connectedRef.current
      connectedRef.current = connected
      setIsConnected(connected)

      if (connected && !wasConnected) {
        void fetchQueue()
      }
    })

    return () => {
      for (const name of channels) {
        echo.channel(name).stopListening(".queue.updated", handler)
      }

      unbind()
    }
  }, [stationId, fetchQueue])

  useEffect(() => {
    if (stationId === null) {
      setStation(null)
      setTickets([])
      setLoading(false)
      setError(null)
      setLastUpdatedAt(null)
      return
    }

    setLoading(true)
    setTickets([])
    setError(null)

    void fetchQueue()

    const interval = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        return
      }

      // WebSocket drives live updates; polling only covers a dropped socket.
      if (connectedRef.current) {
        return
      }

      if (pausedRef.current) {
        return
      }

      void fetchQueue()
    }, POLL_INTERVAL_MS)

    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") {
        return
      }

      if (pausedRef.current) {
        return
      }

      void fetchQueue()
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      // Release the in-flight guard before aborting so the next mount (or the
      // re-run triggered by StrictMode) can fetch immediately.
      inFlightRef.current = false
      abortRef.current?.abort()
      abortRef.current = null
    }
  }, [stationId, fetchQueue])

  const refresh = useCallback(async () => {
    if (stationId === null) {
      return
    }

    if (mountedRef.current) {
      setRefreshing(true)
    }

    try {
      await fetchQueue()
    } finally {
      if (mountedRef.current) {
        setRefreshing(false)
      }
    }
  }, [stationId, fetchQueue])

  const inProgress = tickets.filter((ticket) => ticket.status === "IN_PROGRESS")
  const called = tickets.filter((ticket) => ticket.status === "CALLED")
  const waiting = tickets.filter((ticket) => ticket.status === "CREATED")
  const onHold = tickets.filter((ticket) => ticket.status === "ON_HOLD")

  // "Current" patient is the one this operator is handling. If nobody is
  // assigned (e.g. legacy rows) fall back to the first station ticket.
  const mine = (ticket: QueueTicket) =>
    actorEmail === null || ticket.assigned_to === actorEmail

  const currentTicket =
    inProgress.find(mine) ??
    called.find(mine) ??
    (inProgress.length > 0 ? inProgress[0] : null) ??
    called[0] ??
    null

  return {
    station,
    tickets,
    inProgress,
    called,
    waiting,
    onHold,
    currentTicket,
    loading,
    refreshing,
    error,
    lastUpdatedAt,
    isConnected,
    refresh,
  }
}

/* Alias kept while older call sites are migrated. */
export const useClinicalQueue = useStaffQueue
