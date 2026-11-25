"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"

/**
 * Route-level render failure inside the dashboard shell.
 *
 * Keeps the sidebar/header intact so the operator can navigate away instead of
 * getting a blank screen when one page's server fetch throws.
 */
export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <div>
        <h2 className="text-lg font-semibold">Terjadi kesalahan</h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Halaman ini gagal dimuat. Coba lagi atau kembali ke dasbor.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={reset}>Coba Lagi</Button>

        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/redirect" />}
        >
          Ke Dasbor
        </Button>
      </div>
    </div>
  )
}
