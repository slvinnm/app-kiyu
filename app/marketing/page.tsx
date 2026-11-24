import Link from "next/link"

import { PORTAL_ORIGIN } from "@/lib/tenant/origins"

/**
 * Marketing home.
 *
 * Served only on the bare host (`kiyu.test`), which `proxy.ts` rewrites to
 * `/marketing`. Login and signup live on the Portal host, so links are absolute
 * (`app.kiyu.test`): the bare host serves no application session of its own.
 */
export default function MarketingPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 text-center">
      <div className="flex max-w-md flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">KIYU</h1>
        <p className="text-muted-foreground">
          Platform manajemen antrean untuk organisasi layanan Anda.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          href={`${PORTAL_ORIGIN}/login`}
        >
          Masuk
        </Link>
        <Link
          className="rounded-md border px-4 py-2 text-sm font-medium"
          href={`${PORTAL_ORIGIN}/signup`}
        >
          Daftar
        </Link>
      </div>

      <p className="max-w-md text-xs text-muted-foreground">
        Penyedia layanan: akses ruang kerja organisasi Anda melalui subdomain
        organisasi.
      </p>
    </main>
  )
}
