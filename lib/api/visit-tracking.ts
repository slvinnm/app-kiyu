import type { VisitTrackingData } from "@/types/visit-tracking"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

type TrackingApiResponse = {
  data: VisitTrackingData
  message?: string
}

export async function getVisitTracking(
  token: string,
  signal?: AbortSignal
): Promise<VisitTrackingData> {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured.")
  }

  const response = await fetch(
    `${API_BASE_URL.replace(/\/$/, "")}/queue-sessions/${encodeURIComponent(token)}/track`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
      credentials: "omit",
      signal,
    }
  )

  const payload = (await response
    .json()
    .catch(() => null)) as TrackingApiResponse | null

  if (response.status === 404) {
    throw new Error(
      "Tautan pelacakan tidak valid atau kunjungan sudah tidak tersedia."
    )
  }

  if (!response.ok) {
    throw new Error(payload?.message ?? "Gagal mengambil informasi kunjungan.")
  }

  if (!payload || !payload.data) {
    throw new Error(
      "Respons server tidak sesuai dengan format yang diharapkan."
    )
  }

  return payload.data
}
