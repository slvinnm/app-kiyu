"use client"

import { useCallback, useEffect, useState } from "react"
import { useTenantContext } from "@/contexts/tenant/tenant-context"
import { useToastManager } from "@/components/ui/toast"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"
import { browserApi } from "@/lib/api/browser-client"
import {
  AlertCircleIcon,
  KeyRoundIcon,
  MonitorIcon,
  PlusIcon,
  RefreshCwIcon,
  TabletIcon,
  Trash2Icon,
} from "lucide-react"

interface DeviceRecord {
  id: number
  name: string
  facility_id: number
  is_active: boolean
  is_paired: boolean
  is_awaiting_pairing: boolean
  paired_at: string | null
  last_seen_at: string | null
}

export default function FacilityDevicesPage() {
  const { activeFacilityId } = useTenantContext()
  const toast = useToastManager()

  const [kiosks, setKiosks] = useState<DeviceRecord[]>([])
  const [displays, setDisplays] = useState<DeviceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [pairingNotice, setPairingNotice] = useState<{
    name: string
    code: string
    kind: "kiosk" | "display"
  } | null>(null)

  const [dialogKind, setDialogKind] = useState<"kiosk" | "display" | null>(null)
  const [deviceName, setDeviceName] = useState("")

  const load = useCallback(async () => {
    if (!activeFacilityId) return
    setError("")
    try {
      const [k, d] = await Promise.all([
        browserApi<DeviceRecord[]>("tenant", "/kiosk-devices", {
          params: { facility_id: activeFacilityId },
        }),
        browserApi<DeviceRecord[]>("tenant", "/display-devices", {
          params: { facility_id: activeFacilityId },
        }),
      ])
      setKiosks(k)
      setDisplays(d)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load devices")
    } finally {
      setIsLoading(false)
    }
  }, [activeFacilityId])

  useEffect(() => {
    const timer = setTimeout(() => {
      void load()
    }, 0)
    return () => clearTimeout(timer)
  }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!activeFacilityId || !dialogKind) return
    setError("")
    setIsSubmitting(true)
    const endpoint =
      dialogKind === "kiosk" ? "/kiosk-devices" : "/display-devices"
    try {
      const res = await browserApi<{
        device: DeviceRecord
        pairing_code: string
      }>("tenant", endpoint, {
        method: "POST",
        body: { facility_id: activeFacilityId, name: deviceName },
      })
      setPairingNotice({
        name: deviceName,
        code: res.pairing_code,
        kind: dialogKind,
      })
      setDeviceName("")
      setDialogKind(null)
      toast.add({ title: "Device registered", type: "success" })
      await load()
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to register device"
      setError(msg)
      toast.add({
        title: "Registration failed",
        description: msg,
        type: "error",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleReissue(
    kind: "kiosk" | "display",
    device: DeviceRecord
  ) {
    setError("")
    const endpoint =
      kind === "kiosk"
        ? `/kiosk-devices/${device.id}/pairing-code`
        : `/display-devices/${device.id}/pairing-code`
    try {
      const res = await browserApi<{ pairing_code: string }>(
        "tenant",
        endpoint,
        { method: "POST" }
      )
      setPairingNotice({ name: device.name, code: res.pairing_code, kind })
      toast.add({ title: "Pairing code reissued", type: "success" })
      await load()
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to reissue pairing code"
      setError(msg)
      toast.add({ title: "Error", description: msg, type: "error" })
    }
  }

  async function handleRevoke(kind: "kiosk" | "display", id: number) {
    setError("")
    const endpoint =
      kind === "kiosk" ? `/kiosk-devices/${id}` : `/display-devices/${id}`
    try {
      await browserApi("tenant", endpoint, { method: "DELETE" })
      toast.add({ title: "Device revoked", type: "success" })
      await load()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to revoke device"
      setError(msg)
      toast.add({ title: "Error", description: msg, type: "error" })
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    )
  }

  const renderTable = (kind: "kiosk" | "display", list: DeviceRecord[]) => {
    const filtered = list.filter((d) => d.facility_id === activeFacilityId)
    if (filtered.length === 0) {
      return (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              {kind === "kiosk" ? <TabletIcon /> : <MonitorIcon />}
            </EmptyMedia>
            <EmptyTitle>No {kind} devices</EmptyTitle>
            <EmptyDescription>
              Register a {kind} device to generate a one-time pairing code.
            </EmptyDescription>
          </EmptyHeader>
          <Button onClick={() => setDialogKind(kind)}>
            <PlusIcon data-icon="inline-start" />
            Register {kind === "kiosk" ? "Kiosk" : "Display"}
          </Button>
        </Empty>
      )
    }

    return (
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pairing</TableHead>
              <TableHead>Last Seen</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell>
                  <Badge variant={d.is_active ? "secondary" : "outline"}>
                    {d.is_active ? "Active" : "Revoked"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={d.is_paired ? "secondary" : "outline"}>
                    {d.is_paired
                      ? "Paired"
                      : d.is_awaiting_pairing
                        ? "Awaiting Pairing"
                        : "Unpaired"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {d.last_seen_at
                    ? new Date(d.last_seen_at).toLocaleString()
                    : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {d.is_active && !d.is_paired && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleReissue(kind, d)}
                      >
                        <RefreshCwIcon data-icon="inline-start" />
                        Reissue Code
                      </Button>
                    )}
                    {d.is_active && (
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              aria-label="Revoke device"
                            />
                          }
                        >
                          <Trash2Icon />
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revoke device?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {d.name} will be deactivated immediately and can
                              no longer pair or send intake requests.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              onClick={() => void handleRevoke(kind, d.id)}
                            >
                              Revoke
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Devices</h1>
          <p className="text-sm text-muted-foreground">
            Register and pair Kiosk intake tablets and Display signage screens
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDialogKind("kiosk")}>
            <PlusIcon data-icon="inline-start" />
            Add Kiosk
          </Button>
          <Button onClick={() => setDialogKind("display")}>
            <PlusIcon data-icon="inline-start" />
            Add Display
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {pairingNotice && (
        <Alert>
          <KeyRoundIcon />
          <AlertTitle>
            One-time pairing code for {pairingNotice.name}
          </AlertTitle>
          <AlertDescription className="flex flex-col gap-1">
            <span>
              Enter this code on the{" "}
              {pairingNotice.kind === "kiosk" ? "/kiosk" : "/display"} screen.
              It is shown only once:
            </span>
            <code className="w-fit rounded bg-muted px-3 py-1.5 font-mono text-lg font-bold tracking-widest">
              {pairingNotice.code}
            </code>
          </AlertDescription>
        </Alert>
      )}

      <Dialog
        open={dialogKind !== null}
        onOpenChange={(open) => !open && setDialogKind(null)}
      >
        <DialogTrigger className="hidden" />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Register {dialogKind === "kiosk" ? "Kiosk" : "Display"} Device
            </DialogTitle>
            <DialogDescription>
              Creates a device slot and issues a short pairing code for the
              screen.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="device_name">Device Name</FieldLabel>
                <Input
                  id="device_name"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder={
                    dialogKind === "kiosk" ? "Lobby Kiosk 1" : "Waiting Room TV"
                  }
                  required
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting || !deviceName}>
                {isSubmitting && <Spinner data-icon="inline-start" />}
                Register Device
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="kiosks" className="flex flex-col gap-4">
        <TabsList>
          <TabsTrigger value="kiosks">Kiosk Devices</TabsTrigger>
          <TabsTrigger value="displays">Display Devices</TabsTrigger>
        </TabsList>
        <TabsContent value="kiosks">{renderTable("kiosk", kiosks)}</TabsContent>
        <TabsContent value="displays">
          {renderTable("display", displays)}
        </TabsContent>
      </Tabs>
    </div>
  )
}
