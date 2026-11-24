import { UserRoundIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"


import type { Customer } from "@/types/reception"

export function CustomerSummary({
  customer,
  action,
}: {
  customer: Customer
  action?: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="flex items-start gap-3 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border">
          <UserRoundIcon className="size-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{customer.name}</p>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            {customer.email ?? "Tanpa email"}
          </p>

          {customer.phone && (
            <p className="mt-1 text-xs text-muted-foreground">
              {customer.phone}
            </p>
          )}
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </div>

      <div className="grid gap-4 border-t p-4 sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted-foreground">Alamat</p>

          <p className="mt-1 text-sm font-medium">{customer.address ?? "-"}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Email</p>

          <p className="mt-1 truncate text-sm font-medium">
            {customer.email ?? "-"}
          </p>
        </div>
      </div>
    </div>
  )
}
