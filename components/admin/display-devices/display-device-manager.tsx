"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { KeyRoundIcon, MonitorPlay, PlusIcon, Trash2Icon } from "lucide-react"
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
import { Spinner } from "@/components/ui/spinner"

import { DisplayDeviceFormDialog } from "@/components/admin/display-devices/display-device-form-dialog"

import { getApiErrorMessage } from "@/lib/api/error"
import { deleteDisplayDevice, reissueDisplayPairingCode } from "@/lib/api/admin"

import type { DisplayDevice } from "@/types/reception"

export function DisplayDeviceManager({ rows }: { rows: DisplayDevice[] }) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [revoking, setRevoking] = useState<DisplayDevice | null>(null)
  const [processing, setProcessing] = useState(false)
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [reissuing, setReissuing] = useState<number | null>(null)

  async function handleRevoke() {
    if (!revoking) return

    setProcessing(true)

    try {
      await deleteDisplayDevice(revoking.id)
      toast.success("Layar display dinonaktifkan.")
      setRevoking(null)
      router.refresh()
    } catch (cause) {
      toast.error(getApiErrorMessage(cause, "Gagal menonaktifkan layar."))
    } finally {
      setProcessing(false)
    }
  }

  async function handleReissue(device: DisplayDevice) {
    setReissuing(device.id)

    try {
      const response = await reissueDisplayPairingCode(device.id)
      setPairingCode(response.data.pairing_code)
      toast.success("Kode pairing baru dibuat.")
    } catch (cause) {
      toast.error(getApiErrorMessage(cause, "Gagal membuat kode pairing."))
    } finally {
      setReissuing(null)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Layar Display</CardTitle>
          <CardDescription>
            Layar antrian yang menampilkan panggilan dan status station.
          </CardDescription>
        </div>

        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <PlusIcon />
          Daftarkan Layar
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Belum ada layar display.
          </p>
        ) : (
          rows.map((device) => (
            <div
              key={device.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg border text-muted-foreground">
                  <MonitorPlay className="size-4" />
                </div>

                <div>
                  <p className="font-medium">{device.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {device.is_paired
                      ? `Terakhir aktif: ${
                          device.last_seen_at
                            ? new Date(device.last_seen_at).toLocaleString(
                                "id-ID"
                              )
                            : "Belum pernah"
                        }`
                      : device.is_awaiting_pairing
                        ? "Menunggu kode pairing dimasukkan"
                        : "Belum dipasangkan"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant={device.is_active ? "default" : "outline"}>
                  {device.is_active ? "Aktif" : "Nonaktif"}
                </Badge>

                <Badge variant={device.is_paired ? "secondary" : "outline"}>
                  {device.is_paired ? "Terpasang" : "Belum Pairing"}
                </Badge>

                {device.is_active && (
                  <div className="flex items-center gap-2">
                    {!device.is_paired && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void handleReissue(device)}
                        disabled={reissuing === device.id}
                      >
                        {reissuing === device.id ? (
                          <Spinner />
                        ) : (
                          <KeyRoundIcon />
                        )}
                        Kode Pairing
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRevoking(device)}
                    >
                      <Trash2Icon />
                      Nonaktifkan
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>

      <AlertDialog
        open={pairingCode !== null}
        onOpenChange={(open) => !open && setPairingCode(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kode pairing baru</AlertDialogTitle>
            <AlertDialogDescription>
              Masukkan kode ini di layar display. Berlaku 30 menit dan hanya bisa
              dipakai sekali.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <code className="block rounded-lg bg-muted px-4 py-3 text-center font-mono text-2xl tracking-[0.3em]">
            {pairingCode}
          </code>

          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setPairingCode(null)}>
              Selesai
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DisplayDeviceFormDialog
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
            <AlertDialogTitle>Nonaktifkan layar display?</AlertDialogTitle>
            <AlertDialogDescription>
              Layar ini tidak akan bisa memuat antrian sampai didaftarkan ulang.
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
