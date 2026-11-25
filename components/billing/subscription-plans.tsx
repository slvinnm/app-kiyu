"use client"

import { useState } from "react"
import { CheckIcon } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

import { getApiErrorMessage } from "@/lib/api/error"
import { changeSubscription } from "@/lib/api/admin"
import { featureLabel, isLimitFeature } from "@/lib/billing/features"

import type { TenantPlanCatalogue } from "@/lib/api/admin-server"

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

type Plan = TenantPlanCatalogue["plans"][number]

/** Features (toggles) granted by a plan, as human labels. */
function grantedFeatures(plan: Plan): string[] {
  return plan.entitlements
    .filter((entitlement) => !isLimitFeature(entitlement.feature_code))
    .map((entitlement) => featureLabel(entitlement.feature_code))
}

/** Limits granted by a plan, as `{label, limit}` pairs. */
function grantedLimits(plan: Plan): Array<{ label: string; limit: number }> {
  return plan.entitlements
    .filter((entitlement) => isLimitFeature(entitlement.feature_code))
    .map((entitlement) => ({
      label: featureLabel(entitlement.feature_code),
      limit: entitlement.value?.limit ?? 0,
    }))
}

/**
 * "Langganan Saya" plan grid (PRD §8.2 Billing).
 *
 * Renders the live plan catalogue from the API; the tenant's current plan is
 * marked from the backend's `is_current`, never from local selection. Changing
 * a plan calls the existing subscription endpoint — the backend owns billing
 * rules and activation.
 */
export function SubscriptionPlans({
  catalogue,
}: {
  catalogue: TenantPlanCatalogue
}) {
  const [busyPlanId, setBusyPlanId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function selectPlan(plan: Plan) {
    const price = plan.prices[0]

    if (price === undefined) {
      toast.error("Paket ini belum memiliki harga aktif.")
      return
    }

    setBusyPlanId(plan.id)
    setError(null)

    try {
      const response = await changeSubscription({
        plan_code: plan.code,
        billing_interval: price.billing_interval,
      })

      toast.success(response.message ?? "Paket diperbarui.")
      // The server component refetches; a hard refresh keeps state truthful
      // instead of trusting the local click.
      window.location.reload()
    } catch (cause) {
      const message = getApiErrorMessage(cause, "Gagal memilih paket.")
      setError(message)
      toast.error(message)
    } finally {
      setBusyPlanId(null)
    }
  }

  if (catalogue.plans.length === 0) {
    return (
      <Alert>
        <AlertTitle>Belum ada paket tersedia</AlertTitle>
        <AlertDescription>
          Hubungi administrator platform untuk informasi paket.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Gagal memproses</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {catalogue.plans.map((plan) => {
          const isCurrent = plan.is_current
          const price = plan.prices[0]
          const limits = grantedLimits(plan)

          return (
            <Card
              key={plan.id}
              className={
                isCurrent ? "relative ring-2 ring-primary" : "relative"
              }
            >
              {isCurrent && (
                <Badge className="absolute top-3 right-3">Paket Aktif</Badge>
              )}

              <CardHeader>
                <CardTitle className="text-base">{plan.name}</CardTitle>
                <CardDescription>
                  {plan.description ?? plan.code}
                </CardDescription>

                <div className="mt-2">
                  {price ? (
                    <>
                      <span className="text-2xl font-semibold tabular-nums">
                        {formatMoney(price.amount, price.currency)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {" / "}
                        {price.billing_interval === "MONTHLY"
                          ? "bulan"
                          : "tahun"}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Harga belum tersedia
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex flex-col gap-4 text-sm">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    Fitur
                  </span>
                  {grantedFeatures(plan).length === 0 ? (
                    <span className="text-muted-foreground">
                      Fitur dasar antrean.
                    </span>
                  ) : (
                    grantedFeatures(plan).map((label) => (
                      <span key={label} className="flex items-center gap-2">
                        <CheckIcon className="size-3.5 text-primary" />
                        {label}
                      </span>
                    ))
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    Batas Penggunaan
                  </span>
                  {limits.map((limit) => (
                    <div
                      key={limit.label}
                      className="flex items-center justify-between"
                    >
                      <span>{limit.label}</span>
                      <span className="font-medium tabular-nums">
                        {limit.limit}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={isCurrent ? "outline" : "default"}
                  disabled={
                    isCurrent || busyPlanId !== null || price === undefined
                  }
                  onClick={() => selectPlan(plan)}
                >
                  {busyPlanId === plan.id && (
                    <Spinner data-icon="inline-start" />
                  )}
                  {isCurrent
                    ? "Paket Aktif"
                    : price === undefined
                      ? "Tidak tersedia"
                      : "Pilih Paket"}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
