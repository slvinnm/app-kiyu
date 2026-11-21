import { getVisitAcquisition } from "@/lib/api/reception"

import type { QueueAcquisition } from "@/types/reception"

/**
 * The reception queue returns tickets with `visit_id` but not the acquisition
 * id. Registration completion resolves it through the dedicated
 * `GET /visits/{id}/acquisition` sub-resource.
 *
 * A small per-session cache avoids repeated lookups while the registration
 * dialog is open. Invalidate after a successful registration.
 */
const acquisitionCache = new Map<number, QueueAcquisition | null>()

export async function resolveAcquisitionForVisit(
  visitId: number
): Promise<QueueAcquisition | null> {
  if (acquisitionCache.has(visitId)) {
    return acquisitionCache.get(visitId) ?? null
  }

  const response = await getVisitAcquisition(visitId)
  const acquisition = response.data ?? null

  acquisitionCache.set(visitId, acquisition)

  return acquisition
}

export function clearAcquisitionCache(visitId?: number): void {
  if (visitId === undefined) {
    acquisitionCache.clear()
    return
  }

  acquisitionCache.delete(visitId)
}
