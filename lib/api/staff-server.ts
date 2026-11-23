import "server-only"

import { serverApiFetch } from "@/lib/api/server"

import type { ClinicalQueueSnapshot } from "@/types/staff"
import type { QueueTicket, Station } from "@/types/reception"

export async function getStationQueueServer(
  stationId: number
): Promise<ClinicalQueueSnapshot> {
  const response = await serverApiFetch<{
    station: Station
    data: QueueTicket[]
  }>(`/stations/${stationId}/queue`)

  return {
    station: response.station,
    tickets: response.data,
  }
}
