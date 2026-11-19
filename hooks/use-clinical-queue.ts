"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { getStationQueue } from "@/lib/api/clinical"
import { getApiErrorMessage } from "@/lib/api/error"

import type { QueueTicket, Station } from "@/types/reception"

const POLL_INTERVAL_MS = 15_000

/**
 * Loads the operational queue for a clinical station and keeps it fresh while
 * the tab is visible. The station comes from the signed-in user's assignment.
 */
export function useClinicalQueue(
  stationId: number | null,
  options?: { paused?: boolean }
) {
  const paused = options?.paused ?? false

  const [station, setStation] = useState<Station | null>(null)
  const [tickets, setTickets] = useState<QueueTicket[]>([])
  const [loading, setLoading] = useState(stationId !== null)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)

  const mountedRef = useRef(true)
  const stationRef = useRef(stationId)
  const pausedRef = useRef(paused)
  const inFlightRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)

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
      const response = await getStationQueue(requestedStation, controller.signal)

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
      inFlightRef.current = false

      if (mountedRef.current && stationRef.current === requestedStation) {
        setLoading(false)
      }
    }
  }, [stationId])

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
      abortRef.current?.abort()
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

  const currentTicket = inProgress[0] ?? called[0] ?? null

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
    refresh,
  }
}
