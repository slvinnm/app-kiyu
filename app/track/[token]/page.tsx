import type { Metadata } from "next"

import { VisitTrackingPage } from "@/components/visit-tracking/visit-tracking-page"

export const metadata: Metadata = {
  title: "Pelacakan Kunjungan | KIYU",
  description: "Pantau status kunjungan dan antrean layanan Anda.",
  // The tracking token lives in the URL and the page renders customer data.
  // Keep it out of search indexes and referrer headers.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
}

type PageProps = {
  params: Promise<{
    token: string
  }>
}

export default async function Page({ params }: PageProps) {
  const { token } = await params

  return <VisitTrackingPage token={token} />
}
