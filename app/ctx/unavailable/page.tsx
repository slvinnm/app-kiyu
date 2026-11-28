import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function UnavailablePage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight">
        Organisasi Tidak Aktif
      </h1>
      <p className="mt-4 text-muted-foreground">
        Organisasi ini saat ini sedang tidak aktif atau ditangguhkan.
      </p>
      <div className="mt-6">
        <Link href="/">
          <Button variant="outline">Kembali ke Beranda</Button>
        </Link>
      </div>
    </div>
  )
}
