import { Badge } from "@/components/ui/badge"

/**
 * Page header shared by the portal and platform consoles.
 *
 * The badge names the application context ("Platform" / "Organisasi") so an
 * operator always knows which frontend they are in — the two contexts look
 * different on purpose (PRD §8, §9).
 */
export function ConsolePageHeader({
  context,
  title,
  description,
  icon,
  actions,
}: {
  context: "Platform" | "Organisasi" | "Fasilitas"
  title: string
  description: string
  icon: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{context}</Badge>
            <span className="text-xs text-muted-foreground">KIYU</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>

          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/** A single KPI tile for dashboards, aligned to the console style. */
export function ConsoleStat({
  label,
  value,
  hint,
  icon,
}: {
  label: string
  value: React.ReactNode
  hint?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>

        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>

      <p className="text-2xl font-semibold tabular-nums">{value}</p>

      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
