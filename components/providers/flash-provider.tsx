"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { usePathname } from "next/navigation"

import type { FlashData } from "@/types/flash"

type FlashContextType = {
  flash: FlashData
  clear: (key: string) => void
  clearAll: () => void
}

const FlashContext = createContext<FlashContextType | null>(null)

export function FlashProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const [flash, setFlash] = useState<FlashData>({})

  useEffect(() => {
    let cancelled = false

    async function loadFlash() {
      try {
        const response = await fetch("/api/flash", {
          cache: "no-store",
        })

        if (!response.ok) {
          return
        }

        const result = (await response.json()) as {
          data: FlashData
        }

        if (!cancelled) {
          setFlash(result.data)
        }
      } catch {
        // Flash must never break the page.
      }
    }

    loadFlash()

    return () => {
      cancelled = true
    }
  }, [pathname])

  function clear(key: string) {
    setFlash((current) => {
      const next = { ...current }

      delete next[key]

      return next
    })
  }

  function clearAll() {
    setFlash({})
  }

  return (
    <FlashContext.Provider
      value={{
        flash,
        clear,
        clearAll,
      }}
    >
      {children}
    </FlashContext.Provider>
  )
}

export function useFlash() {
  const context = useContext(FlashContext)

  if (!context) {
    throw new Error("useFlash must be used inside FlashProvider")
  }

  return context
}
