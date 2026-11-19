import { getQueueAcquisitions, getVisitDetail } from "@/lib/api/reception"

import type { QueueAcquisition } from "@/types/reception"

/**
 * `GET /reception/queue` returns tickets with `visit_id` but not the
 * acquisition id. Registration completion needs the acquisition, so resolve
 * it through `GET /visits/{id}` (which eager-loads `queue_acquisitions`).
 *
 * A small per-session cache avoids repeated lookups while the registration
 * dialog is open. Invalidate after a successful registration.
 */
const acquisitionCache = new Map<number, QueueAcquisition | null>()

function pickActiveAcquisition(
  acquisitions: QueueAcquisition[]
): QueueAcquisition | null {
  return (
    acquisitions
      .filter((acquisition) => acquisition.status === "ACQUIRED")
      .sort((a, b) => b.id - a.id)[0] ?? null
  )
}

export async function resolveAcquisitionForVisit(
  visitId: number
): Promise<QueueAcquisition | null> {
  if (acquisitionCache.has(visitId)) {
    return acquisitionCache.get(visitId) ?? null
  }

  const response = await getVisitDetail(visitId)
  const visit = response.data

  let acquisition = pickActiveAcquisition(visit.queue_acquisitions ?? [])

  if (!acquisition) {
    // Defensive fallback: the read model should already include acquisitions,
    // but the index endpoint keeps the flow working if a relation is missing.
    const list = await getQueueAcquisitions({
      department_id: visit.department_id,
      status: "ACQUIRED",
      per_page: 100,
    })

    acquisition =
      list.data.data.find((item) => item.visit_id === visitId) ?? null
  }

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
