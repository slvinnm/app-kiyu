/**
 * Builds a `?a=1&b=2` query string, skipping empty values. The API expects
 * snake_case params and rejects unknown ones, so callers pass only what the
 * endpoint validates.
 */
export function toQuery(
  params: Record<string, string | number | boolean | null | undefined>
): string {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") {
      continue
    }

    search.set(key, String(value))
  }

  const query = search.toString()

  return query ? `?${query}` : ""
}
