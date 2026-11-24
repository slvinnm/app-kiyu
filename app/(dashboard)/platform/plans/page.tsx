import { BadgeDollarSign } from "lucide-react"

import { ConsolePageHeader } from "@/components/console/console-page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { getApiErrorMessage } from "@/lib/api/error"
import { getPlatformPlansServer } from "@/lib/api/platform-server"

import type { PlatformPlan } from "@/types/platform"

function formatMoney(amount: number, currency: string): string {
  return `${currency} ${new Intl.NumberFormat("id-ID").format(amount)}`
}

export default async function Page() {
  let plans: PlatformPlan[] = []
  let error: string | null = null

  try {
    plans = await getPlatformPlansServer()
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat paket.")
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <ConsolePageHeader
        context="Platform"
        title="Paket & Entitlements"
        description="Katalog paket beserta harga dan batas fiturnya."
        icon={<BadgeDollarSign className="size-5" />}
      />

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Data paket tidak tersedia</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : plans.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada paket.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  <Badge variant={plan.is_active ? "secondary" : "outline"}>
                    {plan.is_active ? "Aktif" : "Nonaktif"}
                  </Badge>
                </div>
                <CardDescription>{plan.code}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Harga
                  </span>
                  {plan.prices.filter((price) => price.is_active).length === 0 && (
                    <span className="text-muted-foreground">Belum ada harga aktif.</span>
                  )}
                  {plan.prices
                    .filter((price) => price.is_active)
                    .map((price) => (
                      <span key={price.id}>
                        {formatMoney(price.amount, price.currency)} /{" "}
                        {price.billing_interval === "MONTHLY" ? "bulan" : "tahun"}
                      </span>
                    ))}
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Fitur & Batas
                  </span>
                  {plan.entitlements.length === 0 && (
                    <span className="text-muted-foreground">Tidak ada entitlement.</span>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {plan.entitlements.map((entitlement) => (
                      <Badge key={entitlement.id} variant="outline" className="gap-1">
                        {entitlement.feature_code}
                        {entitlement.value?.limit !== undefined &&
                          `: ${entitlement.value.limit}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
