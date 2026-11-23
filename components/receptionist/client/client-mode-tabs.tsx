"use client"

import { SearchIcon, UserRoundPlusIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export type PatientMode = "existing" | "new"

export function PatientModeTabs({
  value,
  onChange,
}: {
  value: PatientMode
  onChange: (value: PatientMode) => void
}) {
  const options: Array<{
    value: PatientMode
    title: string
    description: string
    icon: React.ReactNode
  }> = [
    {
      value: "existing",
      title: "Pasien Terdaftar",
      description: "Cari dan hubungkan pasien yang sudah ada.",
      icon: <SearchIcon className="size-4" />,
    },
    {
      value: "new",
      title: "Pasien Baru",
      description: "Buat data pasien baru saat registrasi.",
      icon: <UserRoundPlusIcon className="size-4" />,
    },
  ]

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-xl border p-4 text-left transition-colors",
            value === option.value ? "bg-muted" : "hover:bg-muted/50"
          )}
        >
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background">
              {option.icon}
            </div>

            <div>
              <p className="text-sm font-medium">{option.title}</p>

              <p className="mt-1 text-xs text-muted-foreground">
                {option.description}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
