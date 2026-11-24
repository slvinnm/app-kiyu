import { Badge } from "@/components/ui/badge"

export function AdminPageHeader({
  title,
  description,
  icon,
}: {
  title: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Badge variant="outline">Admin</Badge>

        <span className="text-xs text-muted-foreground">Kiyu</span>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>

          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  )
}
