import { ChevronRight, Loader2, Ticket } from "lucide-react"
import { Card } from "@/components/ui/card"

import type { Department } from "@/types/kiosk"

export function DepartmentCard({
  department,
  loading,
  disabled,
  onClick,
}: {
  department: Department
  loading: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={loading || disabled}
      onClick={onClick}
      className="group w-full text-left disabled:cursor-not-allowed"
    >
      <Card className="relative min-h-[190px] overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-ring hover:shadow-xl active:translate-y-0 disabled:opacity-60">
        <div className="flex h-full flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-xl font-bold text-foreground">
              {department.code.slice(-2)}
            </div>

            <div className="flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-all group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
              {loading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <ChevronRight className="size-5" />
              )}
            </div>
          </div>

          <div className="mt-8">
            <p className="mb-1 text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              {department.code}
            </p>

            <h3 className="text-xl leading-tight font-bold text-foreground md:text-2xl">
              {department.name}
            </h3>

            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Mengambil nomor...
                </>
              ) : (
                <>
                  <Ticket className="size-4" />
                  Tekan untuk mengambil antrean
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    </button>
  )
}
