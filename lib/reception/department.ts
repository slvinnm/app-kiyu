import type { Department } from "@/types/reception"

/**
 * Resolves the working department for a receptionist page.
 *
 * Order: explicit URL value -> department assigned to the signed-in user ->
 * the only active department (when there is exactly one). Returns `null` when
 * the user must choose.
 */
export function resolveDepartmentId(
  rawValue: string | string[] | undefined,
  sessionDepartmentId: number | null | undefined,
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

  if (
    typeof sessionDepartmentId === "number" &&
    departments.some((department) => department.id === sessionDepartmentId)
  ) {
    return sessionDepartmentId
  }

  if (departments.length === 1) {
    return departments[0].id
  }

  return null
}

export function findDepartment(
  departments: Department[],
  departmentId: number | null
): Department | null {
  if (departmentId === null) {
    return null
  }

  return (
    departments.find((department) => department.id === departmentId) ?? null
  )
}
