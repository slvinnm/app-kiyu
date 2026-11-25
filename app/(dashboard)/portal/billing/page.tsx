import { CreditCard } from "lucide-react"

import { SubscriptionPlans } from "@/components/billing/subscription-plans"
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

import {
  getSubscriptionServer,
  getTenantPlansServer,
} from "@/lib/api/admin-server"
import { getApiErrorMessage } from "@/lib/api/error"
import { formatDateTime } from "@/lib/reception/format"

import type { SubscriptionView } from "@/lib/api/admin-server"
import type { TenantPlanCatalogue } from "@/lib/api/admin-server"

const STATUS_LABEL: Record<string, string> = {
  TRIALING: "Uji Coba",
  ACTIVE: "Aktif",
  PAST_DUE: "Menunggu Pembayaran",
  CANCELLED: "Dibatalkan",
  EXPIRED: "Kedaluwarsa",
}

/**
 * "Langganan Saya" (PRD §8.2 Billing).
 *
 * The current subscription is shown at the top (real status, never assumed
 * active), then the live plan catalogue as selectable cards. All data comes
 * from the API; the backend owns billing rules and activation.
 */
export default async function Page() {
  let view: SubscriptionView | null = null
  let catalogue: TenantPlanCatalogue | null = null
  let error: string | null = null

  try {
    ;[view, catalogue] = await Promise.all([
      getSubscriptionServer(),
      getTenantPlansServer(),
    ])
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat langganan.")
  }

  const subscription = view?.subscription ?? null

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <ConsolePageHeader
        context="Organisasi"
        title="Langganan Saya"
        description="Pilih paket, lihat status langganan, dan kelola fitur organisasi."
        icon={<CreditCard className="size-5" />}
      />

      {error || !catalogue ? (
        <Alert variant="destructive">
          <AlertTitle>Data langganan tidak tersedia</AlertTitle>
          <AlertDescription>
            {error ?? "Terjadi kesalahan saat memuat langganan."}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">
                    Langganan Saat Ini
                  </CardTitle>
                  <CardDescription>
                    Status paket dan masa berlaku organisasi.
                  </CardDescription>
                </div>

                {subscription && (
                  <Badge
                    variant={view?.is_effective ? "secondary" : "destructive"}
                  >
                    {STATUS_LABEL[subscription.status] ?? subscription.status}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
              {subscription ? (
                <>
                  <Row label="Paket" value={subscription.plan?.name ?? "-"} />
                  <Row
                    label="Interval"
                    value={
                      subscription.billing_interval === "YEARLY"
                        ? "Tahunan"
                        : "Bulanan"
                    }
                  />
                  <Row
                    label="Akhir Periode"
                    value={
                      subscription.current_period_end
                        ? formatDateTime(subscription.current_period_end)
                        : "-"
                    }
                  />
                  {!view?.is_effective && (
                    <p className="text-xs text-destructive sm:col-span-2">
                      Langganan ini belum aktif. Selesaikan pembayaran untuk
                      mengaktifkan fitur paket.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground sm:col-span-2">
                  Organisasi belum memiliki langganan. Pilih paket di bawah
                  untuk memulai.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Pilihan Paket
              </h2>
              <p className="text-sm text-muted-foreground">
                Paket aktif ditandai. Memilih paket lain akan memproses
                perubahan langganan.
              </p>
            </div>

            <SubscriptionPlans catalogue={catalogue} />
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
