"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MonitorSmartphone, PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { KioskDeviceFormDialog } from "@/components/admin/kiosk-devices/kiosk-device-form-dialog"

import { getApiErrorMessage } from "@/lib/api/error"
import { deleteKioskDevice } from "@/lib/api/admin"

import type { KioskDevice } from "@/types/reception"

export function KioskDeviceManager({ rows }: { rows: KioskDevice[] }) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [revoking, setRevoking] = useState<KioskDevice | null>(null)
  const [processing, setProcessing] = useState(false)

  async function handleRevoke() {
    if (!revoking) return

    setProcessing(true)

    try {
      await deleteKioskDevice(revoking.id)
      toast.success("Perangkat kiosk dinonaktifkan.")
      setRevoking(null)
      router.refresh()
    } catch (cause) {
      toast.error(getApiErrorMessage(cause, "Gagal menonaktifkan perangkat."))
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Perangkat Kiosk</CardTitle>
          <CardDescription>
            Mesin anjungan yang melayani pengambilan nomor antrian.
          </CardDescription>
        </div>

        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <PlusIcon />
          Daftarkan Kiosk
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Belum ada perangkat kiosk.
          </p>
        ) : (
          rows.map((device) => (
            <div
              key={device.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg border text-muted-foreground">
                  <MonitorSmartphone className="size-4" />
                </div>

                <div>
                  <p className="font-medium">{device.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Terakhir aktif:{" "}
                    {device.last_seen_at
                      ? new Date(device.last_seen_at).toLocaleString("id-ID")
                      : "Belum pernah"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant={device.is_active ? "default" : "outline"}>
                  {device.is_active ? "Aktif" : "Nonaktif"}
                </Badge>

                {device.is_active && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRevoking(device)}
                  >
                    <Trash2Icon />
                    Nonaktifkan
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>

      <KioskDeviceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={() => router.refresh()}
      />

      <AlertDialog
        open={revoking !== null}
        onOpenChange={(open) => !open && setRevoking(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nonaktifkan perangkat kiosk?</AlertDialogTitle>

            <AlertDialogDescription>
              Perangkat ini tidak akan bisa dipakai lagi sampai didaftarkan
              ulang.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Batal</AlertDialogCancel>

            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault()
                void handleRevoke()
              }}
              disabled={processing}
            >
              Nonaktifkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
