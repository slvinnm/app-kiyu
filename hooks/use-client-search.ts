"use client"

import { useEffect, useState } from "react"

import { getApiErrorMessage } from "@/lib/api/error"
import { searchCustomers } from "@/lib/api/reception"

import type { Paginated, Customer } from "@/types/reception"

const DEBOUNCE_MS = 400

export type CustomerSearchOptions = {
  enabled?: boolean
  page?: number
  perPage?: number
  /** Fetch even when the query is empty (directory mode). */
  enableEmptyQuery?: boolean
  /** Bump to force a retry. */
  refreshKey?: number
}

export function useCustomerSearch(
  query: string,
  options?: CustomerSearchOptions
) {
  const enabled = options?.enabled ?? true
  const page = options?.page ?? 1
  const perPage = options?.perPage ?? 20
  const enableEmptyQuery = options?.enableEmptyQuery ?? false
  const refreshKey = options?.refreshKey ?? 0

  const [results, setResults] = useState<Customer[]>([])
  const [pagination, setPagination] = useState<Paginated<Customer> | null>(null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setResults([])
      setPagination(null)
      setSearching(false)
      setError(null)
      return
    }

    const keyword = query.trim()

    if (!keyword && !enableEmptyQuery) {
      setResults([])
      setPagination(null)
      setSearching(false)
      setError(null)
      return
    }

    let active = true
    const controller = new AbortController()

    const timeout = window.setTimeout(async () => {
      setSearching(true)
      setError(null)

      try {
        const response = await searchCustomers(
          {
            search: keyword || undefined,
            page,
            per_page: perPage,
          },
          controller.signal
        )

        if (!active || controller.signal.aborted) {
          return
        }

        setResults(response.data.data)
        setPagination(response.data)
      } catch (cause) {
        if (!active || controller.signal.aborted) {
          return
        }

        setResults([])
        setPagination(null)
        setError(getApiErrorMessage(cause, "Gagal mencari pasien."))
      } finally {
        if (active) {
          setSearching(false)
        }
      }
    }, DEBOUNCE_MS)

    return () => {
      active = false
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [query, enabled, page, perPage, enableEmptyQuery, refreshKey])

  return {
    results,
    pagination,
    total: pagination?.total ?? results.length,
    searching,
    error,
  }
}
