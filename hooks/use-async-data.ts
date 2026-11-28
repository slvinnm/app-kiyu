"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export interface AsyncDataState<T> {
  data: T | null
  isLoading: boolean
  error: string
  reload: () => Promise<void>
  setData: (data: T | null) => void
}

/**
 * Fetches async data from an effect without triggering the
 * `react-hooks/set-state-in-effect` rule: all state updates happen inside an
 * async continuation, never synchronously in the effect body.
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: ReadonlyArray<unknown>
): AsyncDataState<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const fetcherRef = useRef(fetcher)
  const cancelledRef = useRef(false)
  const isMountedRef = useRef(false)

  useEffect(() => {
    fetcherRef.current = fetcher
  })

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const run = useCallback(async () => {
    try {
      const result = await fetcherRef.current()
      if (!isMountedRef.current) return
      setData(result)
      setError("")
    } catch (err: unknown) {
      if (!isMountedRef.current) return
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      if (isMountedRef.current) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    cancelledRef.current = false

    async function fire() {
      try {
        const result = await fetcherRef.current()
        if (!cancelledRef.current) {
          setData(result)
          setError("")
        }
      } catch (err: unknown) {
        if (!cancelledRef.current)
          setError(err instanceof Error ? err.message : "Failed to load data")
      } finally {
        if (!cancelledRef.current) setIsLoading(false)
      }
    }

    void fire()
    return () => {
      cancelledRef.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  const reload = useCallback(async () => {
    setIsLoading(true)
    await run()
  }, [run])

  return { data, isLoading, error, reload, setData }
}
