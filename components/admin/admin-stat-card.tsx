import { Card, CardContent } from "@/components/ui/card"

export function AdminStatCard({
  label,
  value,
  icon,
  hint,
}: {
  label: string
  value: number | string | null
  icon: React.ReactNode
  hint?: string
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border text-muted-foreground">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>

          <p className="text-xl font-semibold tabular-nums">
            {value ?? "-"}
          </p>

          {hint && (
            <p className="truncate text-[10px] text-muted-foreground">
              {hint}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
