export type TableParams = {
  search?: string
  sort?: string
  direction: "asc" | "desc"
  /** 1-based, as the API expects. */
  page: number
  per_page: number
}

type RawSearchParams = Record<string, string | string[] | undefined>

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

/**
 * Reads the URL state written by `useTableQuery` into API query params. Sort
 * columns are validated against the endpoint's allowlist so an unknown column
 * never reaches the API.
 */
export function parseTableParams(
  searchParams: RawSearchParams,
  options: {
    sortable?: string[]
    defaultPerPage?: number
    filters?: string[]
  } = {}
): { table: TableParams; filters: Record<string, string> } {
  const sort = first(searchParams.sort) ?? ""
  const direction = first(searchParams.direction) === "asc" ? "asc" : "desc"
  const rawPage = Number(first(searchParams.page) ?? 1)
  const rawPerPage = Number(
    first(searchParams.per_page) ?? options.defaultPerPage ?? 10
  )

  const filters: Record<string, string> = {}

  for (const key of options.filters ?? []) {
    const value = first(searchParams[key])

    if (value) {
      filters[key] = value
    }
  }

  return {
    table: {
      search: first(searchParams.search)?.trim() || undefined,
      sort:
        sort && (!options.sortable || options.sortable.includes(sort))
          ? sort
          : undefined,
      direction,
      page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1,
      per_page:
        Number.isInteger(rawPerPage) && rawPerPage > 0
          ? Math.min(rawPerPage, 100)
          : (options.defaultPerPage ?? 10),
    },
    filters,
  }
}

/** Normalises an optional integer filter such as `?department_id=3`. */
export function numberFilter(value: string | undefined): number | undefined {
  if (!value) {
    return undefined
  }

  const parsed = Number(value)

  return Number.isInteger(parsed) ? parsed : undefined
}
