"use client"

import { SearchIcon, UserRoundPlusIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export type CustomerMode = "existing" | "new"

export function CustomerModeTabs({
  value,
  onChange,
}: {
  value: CustomerMode
  onChange: (value: CustomerMode) => void
}) {
  const options: Array<{
    value: CustomerMode
    title: string
    description: string
    icon: React.ReactNode
  }> = [
    {
      value: "existing",
      title: "Pelanggan Terdaftar",
      description: "Cari dan hubungkan pelanggan yang sudah ada.",
      icon: <SearchIcon className="size-4" />,
    },
    {
      value: "new",
      title: "Pelanggan Baru",
      description: "Buat data pelanggan baru saat registrasi.",
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
