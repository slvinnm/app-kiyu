"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react"
import { usePathname, useRouter } from "next/navigation"

import type { SortingState } from "@tanstack/react-table"

/**
 * How long the table waits after the last keystroke before hitting the API.
 * There is deliberately no search button: typing is the trigger.
 */
export const SEARCH_DEBOUNCE_MS = 350

export const DEFAULT_PER_PAGE = 10

const TABLE_KEYS = ["search", "sort", "direction", "page", "per_page"] as const

export type TableQueryState = {
  /** Search term already applied by the server component. */
  search: string
  /** 1-based page already applied by the server component. */
  page: number
  perPage: number
  sort: string
  direction: "asc" | "desc"
  /** Active filter values, exactly as read from the URL. */
  filters?: Record<string, string>
  /** Filter keys this table owns (everything else stays untouched). */
  filterKeys?: string[]
}

type TableValues = {
  search: string
  page: number
  perPage: number
  sort: string
  direction: "asc" | "desc"
  filters: Record<string, string>
}

function readValues(state: TableQueryState): TableValues {
  return {
    search: state.search,
    page: state.page,
    perPage: state.perPage,
    sort: state.sort,
    direction: state.direction,
    filters: { ...(state.filters ?? {}) },
  }
}

function sameFilters(
  a: Record<string, string>,
  b: Record<string, string>
): boolean {
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)

  return (
    aKeys.length === bKeys.length && aKeys.every((key) => a[key] === b[key])
  )
}

/**
 * URL-backed state for a server-driven DataTable. Every interaction (typing,
 * sorting, filtering, paging) writes a query param and the page's server
 * component refetches from the API, so the browser never holds the full set.
 *
 * The page parses `searchParams` and passes the result in; this hook only ever
 * writes back to the URL, which keeps it free of `useSearchParams`.
 */
export function useTableQuery(state: TableQueryState) {
  const router = useRouter()
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()

  const appliedSearch = state.search
  const [searchInput, setSearchInput] = useState(appliedSearch)

  // Values the next URL is built from. Writes advance it immediately, so two
  // quick interactions compose even while the server is still refetching.
  const valuesRef = useRef<TableValues>(readValues(state))

  // Adopt server state only when it differs from what we last wrote: a render
  // caused by our own push matches the ref (no-op), while back/forward or an
  // external link does not, and must win.
  useEffect(() => {
    const incoming = readValues(state)
    const known = valuesRef.current

    if (
      incoming.search !== known.search ||
      incoming.page !== known.page ||
      incoming.perPage !== known.perPage ||
      incoming.sort !== known.sort ||
      incoming.direction !== known.direction ||
      !sameFilters(incoming.filters, known.filters)
    ) {
      valuesRef.current = incoming
    }
  }, [state])

  // When the server applies a search we did not type (back/forward, reset,
  // someone opening a link) mirror it into the box. A search we pushed
  // ourselves is left alone: the user may already be typing the next term.
  const pushedSearchRef = useRef<string | null>(null)

  useEffect(() => {
    if (appliedSearch === pushedSearchRef.current) {
      return
    }

    setSearchInput(appliedSearch)
  }, [appliedSearch])

  const filterKeys = useMemo(
    () => state.filterKeys ?? Object.keys(state.filters ?? {}),
    [state.filterKeys, state.filters]
  )

  /** Applies a partial change and writes the URL. */
  const commit = useCallback(
    (patch: Partial<TableValues>) => {
      const next: TableValues = {
        ...valuesRef.current,
        ...patch,
        filters: patch.filters ?? valuesRef.current.filters,
      }

      valuesRef.current = next

      // Keep every param this table does not own (deep links, tabs, ...).
      const params = new URLSearchParams(window.location.search)

      for (const key of [...TABLE_KEYS, ...filterKeys]) {
        params.delete(key)
      }

      if (next.search) {
        params.set("search", next.search)
      }

      if (next.sort) {
        params.set("sort", next.sort)
        params.set("direction", next.direction)
      }

      if (next.page > 1) {
        params.set("page", String(next.page))
      }

      if (next.perPage !== DEFAULT_PER_PAGE) {
        params.set("per_page", String(next.perPage))
      }

      for (const [key, value] of Object.entries(next.filters)) {
        if (value) {
          params.set(key, value)
        }
      }

      const query = params.toString()

      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, {
          scroll: false,
        })
      })
    },
    [filterKeys, pathname, router]
  )

  // Debounced search: no button, just typing. Changing the search resets paging.
  useEffect(() => {
    const next = searchInput.trim()

    if (next === appliedSearch) {
      return
    }

    const timeout = window.setTimeout(() => {
      pushedSearchRef.current = next
      commit({ search: next, page: 1 })
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timeout)
  }, [searchInput, appliedSearch, commit])

  const setFilter = useCallback(
    (key: string, value: string | number | null | undefined) => {
      const filters = { ...valuesRef.current.filters }

      if (value === "" || value === null || value === undefined) {
        delete filters[key]
      } else {
        filters[key] = String(value)
      }

      commit({ filters, page: 1 })
    },
    [commit]
  )

  // Free-text filters (an audit action, a date, ...) need the same debounce as
  // the search box: no button, and one request per pause in typing.
  const filterTimersRef = useRef<Map<string, number>>(new Map())

  const setFilterDebounced = useCallback(
    (key: string, value: string) => {
      const timers = filterTimersRef.current
      const existing = timers.get(key)

      if (existing !== undefined) {
        window.clearTimeout(existing)
      }

      const timeout = window.setTimeout(() => {
        timers.delete(key)
        setFilter(key, value.trim() || null)
      }, SEARCH_DEBOUNCE_MS)

      timers.set(key, timeout)
    },
    [setFilter]
  )

  useEffect(() => {
    const timers = filterTimersRef.current

    return () => {
      for (const timeout of timers.values()) {
        window.clearTimeout(timeout)
      }

      timers.clear()
    }
  }, [])

  const clearFilters = useCallback(() => {
    pushedSearchRef.current = ""
    commit({ search: "", sort: "", page: 1, filters: {} })
  }, [commit])

  const sorting = useMemo<SortingState>(
    () =>
      state.sort ? [{ id: state.sort, desc: state.direction === "desc" }] : [],
    [state.sort, state.direction]
  )

  const setSorting = useCallback(
    (next: SortingState) => {
      const column = next[0]

      commit(
        column
          ? {
              sort: column.id,
              direction: column.desc ? "desc" : "asc",
              page: 1,
            }
          : { sort: "", page: 1 }
      )
    },
    [commit]
  )

  /** DataTable pages are 0-based; the API is 1-based. */
  const setPageIndex = useCallback(
    (index: number) => {
      commit({ page: index <= 0 ? 1 : index + 1 })
    },
    [commit]
  )

  const setPerPage = useCallback(
    (next: number) => {
      commit({ perPage: next, page: 1 })
    },
    [commit]
  )

  return {
    searchInput,
    setSearchInput,
    sorting,
    setSorting,
    setPageIndex,
    setPerPage,
    setFilter,
    setFilterDebounced,
    clearFilters,
    /** True while the server component is refetching. */
    pending,
  }
}
