"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CreditCard } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { getApiErrorMessage } from "@/lib/api/error"
import { cancelSubscription, changeSubscription } from "@/lib/api/admin"

import type { Subscription } from "@/types/reception"

export function SubscriptionCard({
  subscription,
  isEffective,
}: {
  subscription: Subscription | null
  isEffective: boolean
}) {
  const router = useRouter()
  const [planCode, setPlanCode] = useState("")
  const [interval, setInterval] = useState<"MONTHLY" | "YEARLY">("MONTHLY")
  const [busy, setBusy] = useState(false)

  async function handleChange() {
    if (!planCode.trim()) {
      toast.error("Kode paket wajib diisi.")
      return
    }

    setBusy(true)

    try {
      await changeSubscription({
        plan_code: planCode.trim().toUpperCase(),
        billing_interval: interval,
      })
      toast.success("Paket langganan diperbarui.")
      router.refresh()
    } catch (cause) {
      toast.error(getApiErrorMessage(cause, "Gagal mengubah paket."))
    } finally {
      setBusy(false)
    }
  }

  async function handleCancel() {
    setBusy(true)

    try {
      await cancelSubscription()
      toast.success("Langganan dibatalkan di akhir periode.")
      router.refresh()
    } catch (cause) {
      toast.error(getApiErrorMessage(cause, "Gagal membatalkan langganan."))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="size-4" />
            Langganan Saat Ini
          </CardTitle>

          <CardDescription>
            Status paket dan masa berlaku tenant.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 text-sm">
          {subscription ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Paket</span>
                <span className="font-medium">
                  {subscription.plan?.name ?? subscription.plan_id}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={isEffective ? "default" : "outline"}>
                  {subscription.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Interval</span>
                <span>{subscription.billing_interval ?? "—"}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Periode</span>
                <span>
                  {subscription.current_period_start
                    ? new Date(
                        subscription.current_period_start
                      ).toLocaleDateString("id-ID")
                    : "—"}{" "}
                  –{" "}
                  {subscription.current_period_end
                    ? new Date(
                        subscription.current_period_end
                      ).toLocaleDateString("id-ID")
                    : "—"}
                </span>
              </div>

              {subscription.cancel_at_period_end && (
                <Alert>
                  <AlertTitle>Dibatalkan</AlertTitle>
                  <AlertDescription>
                    Langganan berakhir pada akhir periode berjalan.
                  </AlertDescription>
                </Alert>
              )}

              {subscription.plan?.entitlements?.length ? (
                <div className="space-y-1 pt-2">
                  <p className="text-muted-foreground">Fitur paket</p>

                  <div className="flex flex-wrap gap-2">
                    {subscription.plan.entitlements.map((entitlement) => (
                      <Badge key={entitlement.id} variant="outline">
                        {entitlement.feature_code}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              {!subscription.cancel_at_period_end && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={busy}
                >
                  Batalkan Langganan
                </Button>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">
              Tenant belum memiliki langganan aktif.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ganti Paket</CardTitle>

          <CardDescription>
            Masukkan kode paket yang ingin diaktifkan.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plan-code">Kode Paket</Label>

            <Input
              id="plan-code"
              value={planCode}
              onChange={(event) => setPlanCode(event.target.value)}
              placeholder="Contoh: TRIAL"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan-interval">Interval</Label>

            <Select
              value={interval}
              onValueChange={(value) =>
                setInterval(value === "YEARLY" ? "YEARLY" : "MONTHLY")
              }
            >
              <SelectTrigger id="plan-interval">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="MONTHLY">Bulanan</SelectItem>
                <SelectItem value="YEARLY">Tahunan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleChange} disabled={busy}>
            Simpan Paket
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
