import { CreditCard } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { ConsolePageHeader } from "@/components/console/console-page-header"
import { SubscriptionCard } from "@/components/facility/billing/subscription-card"

import { getSubscriptionServer } from "@/lib/api/admin-server"
import { getApiErrorMessage } from "@/lib/api/error"

import type { SubscriptionView } from "@/lib/api/admin-server"

export default async function Page() {
  let view: SubscriptionView | null = null
  let error: string | null = null

  try {
    view = await getSubscriptionServer()
  } catch (cause) {
    error = getApiErrorMessage(cause, "Gagal memuat langganan.")
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
      <ConsolePageHeader
        context="Organisasi"
        title="Billing"
        description="Status langganan dan paket tenant."
        icon={<CreditCard className="size-5" />}
      />

      {error || !view ? (
        <Alert variant="destructive">
          <AlertTitle>Data langganan tidak tersedia</AlertTitle>

          <AlertDescription>
            {error ?? "Terjadi kesalahan saat memuat langganan."}
          </AlertDescription>
        </Alert>
      ) : (
        <SubscriptionCard
          subscription={view.subscription}
          isEffective={view.is_effective}
        />
      )}
    </div>
  )
}
