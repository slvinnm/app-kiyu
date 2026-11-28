import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight">404 — Not Found</h1>
      <p className="mt-4 text-muted-foreground">
        Halaman atau organisasi yang Anda cari tidak ditemukan.
      </p>
      <div className="mt-6">
        <Link href="/">
          <Button>Kembali ke Beranda</Button>
        </Link>
      </div>
    </div>
  )
}
