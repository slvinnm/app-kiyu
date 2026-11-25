import { Badge } from "@/components/ui/badge"

type StatusBadgeProps = {
  status: string | null | undefined
  className?: string
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string
    className: string
  }
> = {
  AWAITING_CHECKIN: {
    label: "Menunggu check-in",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  },
  WAITING: {
    label: "Menunggu layanan",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  },
  CREATED: {
    label: "Menunggu dipanggil",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  },
  CALLED: {
    label: "Dipanggil",
    className:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
  },
  IN_PROGRESS: {
    label: "Sedang berlangsung",
    className:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
  },
  ON_HOLD: {
    label: "Ditunda",
    className:
      "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300",
  },
  COMPLETED: {
    label: "Selesai",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  },
  SKIPPED: {
    label: "Dilewati",
    className: "border-muted bg-muted text-muted-foreground",
  },
  CANCELLED: {
    label: "Dibatalkan",
    className:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  },
  NO_SHOW: {
    label: "Tidak hadir",
    className:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  },
  TRANSFERRED: {
    label: "Dialihkan",
    className:
      "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300",
  },
  NOT_STARTED: {
    label: "Belum dimulai",
    className: "border-muted bg-muted text-muted-foreground",
  },
  ACQUIRED: {
    label: "Berhasil diambil",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  },
  REGISTERED: {
    label: "Terdaftar",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  },
  PENDING: {
    label: "Menunggu",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  },
  ACCEPTED: {
    label: "Diterima",
    className:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = status ? STATUS_CONFIG[status] : undefined

  return (
    <Badge
      variant="outline"
      className={[
        "h-auto rounded-full px-2.5 py-1 text-[11px] font-medium",
        config?.className ?? "border-muted bg-muted text-muted-foreground",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {config?.label ?? status?.replaceAll("_", " ") ?? "Tidak diketahui"}
    </Badge>
  )
}
