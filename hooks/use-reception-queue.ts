"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { getApiErrorMessage, getApiErrorType } from "@/lib/api/error"
import { getReceptionQueue } from "@/lib/api/reception"
import { bindEchoConnectionState, getEcho } from "@/lib/echo"

import type { ReceptionQueueSnapshot } from "@/types/reception"

const POLL_INTERVAL_MS = 15_000

/**
 * Loads the reception queue for a department and keeps it fresh while the tab
 * is visible. Polling pauses when a dialog is open (`paused`) so the list does
 * not change under the user's cursor.
 */
export function useReceptionQueue(
  departmentId: number | null,
  options?: { paused?: boolean }
) {
  const paused = options?.paused ?? false

  const [snapshot, setSnapshot] = useState<ReceptionQueueSnapshot | null>(null)
  const [loading, setLoading] = useState(departmentId !== null)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invalidWorkflow, setInvalidWorkflow] = useState(false)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)

  const mountedRef = useRef(true)
  const departmentRef = useRef(departmentId)
  const pausedRef = useRef(paused)
  const invalidWorkflowRef = useRef(false)
  const inFlightRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)
  const connectedRef = useRef(false)

  useEffect(() => {
    departmentRef.current = departmentId
  }, [departmentId])

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    invalidWorkflowRef.current = invalidWorkflow
  }, [invalidWorkflow])

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
      abortRef.current?.abort()
    }
  }, [])

  const fetchQueue = useCallback(async () => {
    if (departmentId === null || inFlightRef.current) {
      return
    }

    const requestedDepartment = departmentId

    inFlightRef.current = true
    abortRef.current?.abort()

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const response = await getReceptionQueue(
        requestedDepartment,
        controller.signal
      )

      if (
        !mountedRef.current ||
        controller.signal.aborted ||
        departmentRef.current !== requestedDepartment
      ) {
        return
      }

      setSnapshot(response.data)
      setError(null)
      setInvalidWorkflow(false)
      setLastUpdatedAt(new Date())
    } catch (cause) {
      if (
        !mountedRef.current ||
        controller.signal.aborted ||
        departmentRef.current !== requestedDepartment
      ) {
        return
      }

      if (getApiErrorType(cause) === "INVALID_WORKFLOW") {
        setInvalidWorkflow(true)
        setSnapshot(null)
      }

      setError(getApiErrorMessage(cause, "Gagal memuat antrian reception."))
    } finally {
      // Only the latest request owns the in-flight flag. A StrictMode cleanup
      // aborts the first request; without this guard the flag stays stuck and
      // blocks the real fetch until the user refreshes.
      if (abortRef.current === controller) {
        abortRef.current = null
        inFlightRef.current = false
      }

      if (mountedRef.current && departmentRef.current === requestedDepartment) {
        setLoading(false)
      }
    }
  }, [departmentId])

  // Live updates: refetch whenever anyone changes the queue at this station
  // (call, start, complete, hold, transfer, new ticket, ...).
  useEffect(() => {
    if (departmentId === null) {
      return
    }

    const echo = getEcho()

    if (!echo) {
      return
    }

    const channels = [`department.${departmentId}`]

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
  }, [departmentId, fetchQueue])

  useEffect(() => {
    if (departmentId === null) {
      setSnapshot(null)
      setLoading(false)
      setError(null)
      setInvalidWorkflow(false)
      setLastUpdatedAt(null)
      return
    }

    setLoading(true)
    setSnapshot(null)
    setError(null)
    setInvalidWorkflow(false)

    void fetchQueue()

    const interval = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        return
      }

      // Live WebSocket updates are the primary source; polling is only a
      // safety net while the socket is down.
      if (connectedRef.current) {
        return
      }

      if (pausedRef.current || invalidWorkflowRef.current) {
        return
      }

      void fetchQueue()
    }, POLL_INTERVAL_MS)

    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") {
        return
      }

      if (pausedRef.current || invalidWorkflowRef.current) {
        return
      }

      void fetchQueue()
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      // Release the guard before aborting so a StrictMode re-run or a quick
      // remount can fetch without waiting for a manual refresh.
      inFlightRef.current = false
      abortRef.current?.abort()
      abortRef.current = null
    }
  }, [departmentId, fetchQueue])

  const refresh = useCallback(async () => {
    if (departmentId === null) {
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
  }, [departmentId, fetchQueue])

  return {
    snapshot,
    loading,
    refreshing,
    error,
    invalidWorkflow,
    lastUpdatedAt,
    refresh,
  }
}
