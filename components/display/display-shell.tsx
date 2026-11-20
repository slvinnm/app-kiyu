import { MonitorPlay } from "lucide-react"

import { DisplayClock } from "@/components/display/display-clock"

export function DisplayShell({
  title,
  subtitle,
  lastUpdatedAt,
  children,
}: {
  title: string
  subtitle?: string
  lastUpdatedAt: Date | null
  children: React.ReactNode
}) {
  return (
    <div className="min-h-svh bg-neutral-950 text-neutral-100">
      <header className="border-b border-white/10">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500 text-neutral-950">
              <MonitorPlay className="size-6" />
            </div>

            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-neutral-400 uppercase">
                Kiyu
              </p>

              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                {title}
              </h1>

              {subtitle && (
                <p className="text-sm text-neutral-400">{subtitle}</p>
              )}
            </div>
          </div>

          <DisplayClock />
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 py-6">{children}</main>

      <footer className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 pb-6 text-xs text-neutral-500">
        <span>Menampilkan data antrian publik · tanpa data pribadi</span>

        <span>
          Diperbarui{" "}
          {lastUpdatedAt
            ? new Intl.DateTimeFormat("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
              }).format(lastUpdatedAt)
            : "-"}
        </span>
      </footer>
    </div>
  )
}
