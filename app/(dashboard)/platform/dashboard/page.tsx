import Link from "next/link"
import {
  ArrowRightIcon,
  Building2,
  CircleDollarSign,
  GaugeIcon,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react"

import { ConsolePageHeader, ConsoleStat } from "@/components/console/console-page-header"
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

import { getApiErrorMessage } from "@/lib/api/error"
import { getPlatformDashboardServer } from "@/lib/api/platform-server"

import type { PlatformDashboard } from "@/types/platform"

function formatMoney(amount: number, currency: string | null): string {
  const formatted = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(amount)

  return currency ? `${currency} ${formatted}` : formatted
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value)
}

/** SaaS business dashboard for PlatformAdmin (PRD §8.1). */
export default async function Page() {
  let dashboard: PlatformDashboard | null = null
  let error: string | null = null

  try {
    dashboard = await getPlatformDashboardServer()
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat dasbor platform.")
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <ConsolePageHeader
        context="Platform"
        title="Dasbor Platform"
        description="Kesehatan bisnis SaaS KIYU: tenant, langganan, pendapatan, dan pembayaran."
        icon={<GaugeIcon />}
      />

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Dasbor tidak dapat dimuat</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {dashboard && (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ConsoleStat
              label="Total Tenant"
              value={formatNumber(dashboard.tenants.total)}
              hint={`${formatNumber(dashboard.tenants.new_in_range)} baru dalam rentang`}
              icon={<Building2 className="size-4" />}
            />
            <ConsoleStat
              label="Langganan Efektif"
              value={formatNumber(dashboard.subscriptions.effective)}
              hint={`${formatNumber(dashboard.active_plans)} paket aktif`}
              icon={<Users className="size-4" />}
            />
            <ConsoleStat
              label="MRR"
              value={formatMoney(dashboard.mrr.amount, dashboard.mrr.currency)}
              hint={`${formatNumber(dashboard.mrr.subscriptions)} langganan berbayar`}
              icon={<TrendingUp className="size-4" />}
            />
            <ConsoleStat
              label="Koleksi Pembayaran"
              value={formatMoney(dashboard.collection_in_range, dashboard.mrr.currency)}
              hint="Pembayaran PAID dalam rentang"
              icon={<CircleDollarSign className="size-4" />}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wallet className="size-4 text-muted-foreground" />
                  Status Langganan
                </CardTitle>
                <CardDescription>Distribusi seluruh langganan.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {Object.entries(dashboard.subscriptions.by_status).length === 0 && (
                  <p className="text-sm text-muted-foreground">Belum ada langganan.</p>
                )}

                {Object.entries(dashboard.subscriptions.by_status).map(
                  ([status, total]) => (
                    <Badge key={status} variant="secondary" className="gap-1">
                      {status}
                      <span className="tabular-nums">{formatNumber(total)}</span>
                    </Badge>
                  )
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="size-4 text-muted-foreground" />
                  Status Tenant
                </CardTitle>
                <CardDescription>Distribusi tenant menurut status.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {Object.entries(dashboard.tenants.by_status).map(
                  ([status, total]) => (
                    <Badge key={status} variant="secondary" className="gap-1">
                      {status}
                      <span className="tabular-nums">{formatNumber(total)}</span>
                    </Badge>
                  )
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tindakan Tertunda</CardTitle>
              <CardDescription>
                Pembayaran gagal dan webhook bermasalah dalam rentang.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Badge variant={dashboard.failed_payments_in_range > 0 ? "destructive" : "secondary"}>
                {formatNumber(dashboard.failed_payments_in_range)} pembayaran gagal
              </Badge>
              <Badge variant={dashboard.failed_webhooks_in_range > 0 ? "destructive" : "secondary"}>
                {formatNumber(dashboard.failed_webhooks_in_range)} webhook gagal
              </Badge>

              <Button
                variant="outline"
                size="sm"
                render={<Link href="/platform/payments/webhooks" />}
              >
                Riwayat Webhook
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
