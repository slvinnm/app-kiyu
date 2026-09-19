"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { usePathname } from "next/navigation"

import type { FlashData } from "@/types/flash"

type FlashContextType = {
  flash: FlashData
  has: (key: string) => boolean
  get: <T = unknown>(key: string) => T | undefined
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

  function has(key: string) {
    return key in flash
  }

  function get<T = unknown>(key: string) {
    return flash[key] as T | undefined
  }

  return (
    <FlashContext.Provider
      value={{
        flash,
        has,
        get,
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
