"use client"

import { usePathname, useRouter } from "next/navigation"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { Department } from "@/types/reception"

export function DepartmentSwitcher({
  departments,
  value,
  disabled,
}: {
  departments: Department[]
  value: number | null
  disabled?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()

  function handleChange(nextValue: string | null) {
    if (!nextValue) {
      return
    }

    router.replace(`${pathname}?department_id=${nextValue}`, {
      scroll: false,
    })
  }

  return (
    <Select
      value={value ? String(value) : ""}
      onValueChange={handleChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-full sm:w-[260px]" aria-label="Pilih poli">
        <SelectValue placeholder="Pilih poli" />
      </SelectTrigger>

      <SelectContent>
        {departments.map((department) => (
          <SelectItem key={department.id} value={String(department.id)}>
            {department.name} ({department.code})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
