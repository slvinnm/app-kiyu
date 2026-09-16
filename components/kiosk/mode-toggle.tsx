"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Ubah tema"
        className="size-10 rounded-xl"
      >
        <Moon className="size-4" />
        <span className="sr-only">Ubah tema</span>
      </Button>
    )
  }

  const isDark = resolvedTheme === "dark"

  const label = isDark ? "Gunakan mode terang" : "Gunakan mode gelap"

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark")
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            aria-label={label}
            aria-pressed={isDark}
            className="size-10 rounded-xl"
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}

            <span className="sr-only">{label}</span>
          </Button>
        }
      />

      <TooltipContent side="bottom">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  )
}
