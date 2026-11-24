"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { BuildingIcon } from "lucide-react"
import { toast } from "sonner"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { selectFacility } from "@/lib/facility/actions"

export type FacilityOption = {
  id: number
  name: string
}

/**
 * Facility switcher for the sidebar.
 *
 * One facility renders as a plain label: there is nothing to choose, and a
 * disabled control reads as a bug. Several render as a select that persists the
 * choice through a server action, then refreshes so every server component
 * refetches for the new branch (PRD §4.3).
 */
export function FacilitySwitcher({
  facilities,
  activeId,
}: {
  facilities: FacilityOption[]
  activeId: number | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [current, setCurrent] = useState<string | null>(
    activeId !== null ? String(activeId) : null
  )

  if (facilities.length === 0) {
    return null
  }

  const activeName =
    facilities.find((facility) => String(facility.id) === current)?.name ??
    facilities[0]?.name

  if (facilities.length === 1) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="cursor-default">
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <BuildingIcon />
            </div>

            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate text-sm font-medium">
                {activeName}
              </span>

              <span className="truncate text-xs text-muted-foreground">
                Fasilitas aktif
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  function handleChange(value: string | null) {
    if (!value || value === current) {
      return
    }

    const previous = current
    setCurrent(value)

    startTransition(async () => {
      const result = await selectFacility(Number(value))

      if (!result.ok) {
        setCurrent(previous)
        toast.error(result.message)

        return
      }

      toast.success("Fasilitas diganti.")
      router.refresh()
    })
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Select value={current} onValueChange={handleChange} disabled={pending}>
          <SelectTrigger
            className="h-auto w-full justify-start gap-2 py-2 data-[size=default]:h-auto"
            aria-label="Pilih fasilitas"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <BuildingIcon />
            </div>

            <div className="grid flex-1 text-left leading-tight">
              <span className="text-xs text-muted-foreground">Fasilitas</span>

              <SelectValue />
            </div>
          </SelectTrigger>

          <SelectContent>
            {facilities.map((facility) => (
              <SelectItem key={facility.id} value={String(facility.id)}>
                {facility.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
