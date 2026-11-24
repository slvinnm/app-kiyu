import type { Department, Station } from "@/types/reception"

/**
 * Resolves the working department for a receptionist page.
 *
 * Order: explicit URL value -> department of the user's assigned station ->
 * the only active department (when there is exactly one). Returns `null` when
 * the user must choose.
 *
 * The API has no `department_id` on a user: a staff account is placed by its
 * `station_id`, and a station belongs to a department. That is the only
 * authoritative source for "where does this person work".
 */
export function resolveDepartmentId(
  rawValue: string | string[] | undefined,
  stations: Pick<Station, "id" | "department_id">[],
  sessionStationId: number | null | undefined,
  departments: Department[]
): number | null {
  const candidate = Array.isArray(rawValue) ? rawValue[0] : rawValue
  const parsed = candidate ? Number(candidate) : Number.NaN

  if (
    Number.isInteger(parsed) &&
    departments.some((department) => department.id === parsed)
  ) {
    return parsed
  }

  if (typeof sessionStationId === "number") {
    const station = stations.find((candidate) => candidate.id === sessionStationId)

    if (
      station &&
      departments.some((department) => department.id === station.department_id)
    ) {
      return station.department_id
    }
  }

  if (departments.length === 1) {
    return departments[0].id
  }

  return null
}
