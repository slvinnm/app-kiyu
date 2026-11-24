import Link from "next/link"
import {
  Building2,
  GaugeIcon,
  MonitorPlay,
  Ticket,
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
import { getPortalDashboardServer } from "@/lib/api/platform-server"

import type { PortalDashboard } from "@/types/platform"

function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value)
}

/** Organization dashboard for TenantAdmin (PRD §8.2). */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ facility_id?: string }>
}) {
  const params = await searchParams
  const facilityId = params.facility_id ? Number(params.facility_id) : undefined

  let dashboard: PortalDashboard | null = null
  let error: string | null = null

  try {
    dashboard = await getPortalDashboardServer({ facility_id: facilityId })
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat dasbor organisasi.")
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <ConsolePageHeader
        context="Organisasi"
        title={dashboard ? dashboard.tenant.name : "Dasbor"}
        description="Ringkasan organisasi Anda di seluruh fasilitas."
        icon={<GaugeIcon />}
        actions={
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/portal/facilities" />}
          >
            <Building2 data-icon="inline-start" />
            Kelola Fasilitas
          </Button>
        }
      />

      {error || !dashboard ? (
        <Alert variant="destructive">
          <AlertTitle>Dasbor tidak dapat dimuat</AlertTitle>
          <AlertDescription>{error ?? "Terjadi kesalahan."}</AlertDescription>
        </Alert>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ConsoleStat
              label="Fasilitas"
              value={formatNumber(dashboard.counts.facilities)}
              hint={`Batas paket: ${dashboard.usage.max_facilities || "∞"}`}
              icon={<Building2 className="size-4" />}
            />
            <ConsoleStat
              label="Departemen"
              value={formatNumber(dashboard.counts.departments)}
              icon={<Building2 className="size-4" />}
            />
            <ConsoleStat
              label="Loket"
              value={formatNumber(dashboard.counts.stations)}
              icon={<Ticket className="size-4" />}
            />
            <ConsoleStat
              label="Pelanggan"
              value={formatNumber(dashboard.counts.customers)}
              icon={<Users className="size-4" />}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Antrean Hari Ini</CardTitle>
                <CardDescription>
                  Sesi antrean yang dibuat hari ini di seluruh fasilitas.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <MiniStat label="Total" value={dashboard.counts.sessions_today} />
                <MiniStat label="Menunggu" value={dashboard.counts.waiting} />
                <MiniStat label="Diproses" value={dashboard.counts.in_progress} />
                <MiniStat label="Selesai" value={dashboard.counts.completed} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wallet className="size-4 text-muted-foreground" />
                  Langganan
                </CardTitle>
                <CardDescription>
                  {dashboard.subscription?.plan?.name ?? "Belum berlangganan"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                {dashboard.subscription ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          dashboard.subscription.is_effective ? "secondary" : "destructive"
                        }
                      >
                        {dashboard.subscription.status}
                      </Badge>
                      {dashboard.subscription.current_period_end && (
                        <span className="text-xs text-muted-foreground">
                          hingga{" "}
                          {new Date(
                            dashboard.subscription.current_period_end
                          ).toLocaleDateString("id-ID")}
                        </span>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      render={<Link href="/portal/billing" />}
                    >
                      Kelola Langganan
                    </Button>
                  </>
                ) : (
                  <Button size="sm" render={<Link href="/portal/billing" />}>
                    Pilih Paket
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ConsoleStat
              label="Kiosk Terpasang"
              value={formatNumber(dashboard.usage.kiosk_devices)}
              hint={`Batas paket: ${dashboard.usage.max_kiosk_devices || "∞"}`}
              icon={<Ticket className="size-4" />}
            />
            <ConsoleStat
              label="Kanal Online"
              value={formatNumber(dashboard.channels.ONLINE ?? 0)}
              hint="Sesi hari ini"
              icon={<MonitorPlay className="size-4" />}
            />
            <ConsoleStat
              label="Kanal Kiosk"
              value={formatNumber(dashboard.channels.KIOSK ?? 0)}
              hint="Sesi hari ini"
              icon={<MonitorPlay className="size-4" />}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold tabular-nums">
        {formatNumber(value)}
      </span>
    </div>
  )
}
