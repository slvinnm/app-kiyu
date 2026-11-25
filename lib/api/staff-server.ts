import "server-only"

import { serverApiFetch } from "@/lib/api/server"

import type { ClinicalQueueSnapshot } from "@/types/staff"
import type { QueueTicket, Station } from "@/types/reception"

export async function getStationQueueServer(
  stationId: number
): Promise<ClinicalQueueSnapshot> {
  // The API returns a paginator (`data.data`), not a bare array.
  const response = await serverApiFetch<{
    station: Station
    data: { data: QueueTicket[] }
  }>(`/stations/${stationId}/queue`)

  return {
    station: response.station,
    tickets: response.data.data,
  }
}
