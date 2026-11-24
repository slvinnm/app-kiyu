import { ReceiptText } from "lucide-react"

import { ConsolePageHeader } from "@/components/console/console-page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { getApiErrorMessage } from "@/lib/api/error"
import { getSubscriptionServer } from "@/lib/api/admin-server"

/**
 * TenantAdmin payment history (PRD §8.2 Billing → Riwayat Pembayaran).
 *
 * The tenant API exposes its subscription and plan; per-payment history is
 * surfaced through the platform records. Until a tenant-scoped payment list is
 * added, this page explains where charges appear rather than fabricating rows.
 */
export default async function Page() {
  let view = null
  let error: string | null = null

  try {
    view = await getSubscriptionServer()
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat langganan.")
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <ConsolePageHeader
        context="Organisasi"
        title="Riwayat Pembayaran"
        description="Riwayat pembayaran langganan organisasi."
        icon={<ReceiptText className="size-5" />}
      />

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Data langganan tidak tersedia</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pembayaran Langganan</CardTitle>
            <CardDescription>
              {view?.subscription
                ? `Paket ${view.subscription.plan?.name ?? "-"} · status ${view.subscription.status}`
                : "Organisasi belum memiliki langganan aktif."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Rincian transaksi per pembayaran tersedia melalui tim penagihan KIYU.
            Perubahan paket dan pembayaran tercatat pada langganan organisasi Anda.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
