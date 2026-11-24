import Link from "next/link"

/**
 * Marketing home.
 *
 * Served only on the bare host (`kiyu.test`), which `proxy.ts` rewrites to
 * `/marketing`. It is deliberately small: the product surfaces live on the
 * portal (`app.kiyu.test`) and on tenant subdomains, and there is no marketing
 * copy to publish yet.
 */
export default function MarketingPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 text-center">
      <div className="flex max-w-md flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">KIYU</h1>
        <p className="text-muted-foreground">
          Antrean dan pelayanan fasilitas kesehatan, dalam satu platform.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          href="/login"
        >
          Masuk
        </Link>
        <Link
          className="rounded-md border px-4 py-2 text-sm font-medium"
          href="/signup"
        >
          Daftar
        </Link>
      </div>

      <p className="max-w-md text-xs text-muted-foreground">
        Penyedia layanan: akses portal Anda melalui subdomain organisasi.
      </p>
    </main>
  )
}
