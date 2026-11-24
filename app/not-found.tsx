import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <div>
        <p className="text-sm font-medium text-muted-foreground">404</p>

        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Halaman tidak ditemukan
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Tautan ini mungkin sudah tidak berlaku.
        </p>
      </div>

      <Link href="/" className={buttonVariants()}>
        Ke Dasbor
      </Link>
    </main>
  )
}