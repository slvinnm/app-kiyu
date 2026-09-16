import type { Department } from "@/types/kiosk"

import { RefreshCw, RotateCcw, WifiOff, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function ErrorScreen({
  message,
  department,
  onRetry,
  onReset,
}: {
  message: string
  department: Department | null
  onRetry: () => void
  onReset: () => void
}) {
  return (
    <div className="flex w-full max-w-xl items-center justify-center">
      <Card className="w-full rounded-3xl">
        <div className="px-6 py-8 text-center md:px-10 md:py-10">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border bg-muted">
            <XCircle className="size-7" />
          </div>

          <p className="mt-4 text-sm font-medium text-muted-foreground">
            Permintaan tidak dapat diproses
          </p>

          <h2 className="mt-1.5 text-2xl font-semibold tracking-tight">
            Nomor antrean belum berhasil diambil
          </h2>

          {department && (
            <p className="mt-2 text-sm text-muted-foreground">
              {department.name}
            </p>
          )}

          <div className="mx-auto mt-6 max-w-md rounded-xl border bg-muted/30 px-5 py-4 text-left">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border bg-background">
                <WifiOff className="size-4" />
              </div>

              <div>
                <p className="text-sm font-medium">Terjadi kendala</p>

                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  {message}
                </p>
              </div>
            </div>
          </div>

          <p className="mx-auto mt-5 max-w-md text-xs leading-5 text-muted-foreground">
            Silakan coba kembali. Jika masalah tetap terjadi, hubungi petugas
            untuk mendapatkan bantuan.
          </p>

          <div className="mx-auto mt-7 flex max-w-md flex-col-reverse gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={onReset}
              className="h-10 flex-1 rounded-lg"
            >
              <RotateCcw className="mr-2 size-4" />
              Kembali
            </Button>

            <Button onClick={onRetry} className="h-10 flex-1 rounded-lg">
              <RefreshCw className="mr-2 size-4" />
              Coba Lagi
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
