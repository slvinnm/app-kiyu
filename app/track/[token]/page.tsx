import type { Metadata } from "next"

import { VisitTrackingPage } from "@/components/visit-tracking/visit-tracking-page"

export const metadata: Metadata = {
  title: "Pelacakan Kunjungan | KIYU",
  description: "Pantau status kunjungan dan antrean layanan Anda.",
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