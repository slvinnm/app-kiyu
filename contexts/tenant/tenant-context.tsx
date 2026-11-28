"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import { useRouter } from "next/navigation"

export interface TenantFacility {
  id: number
  name: string
  code: string
}

export interface TenantUser {
  id: number
  name: string
  email: string
  role: "facility_admin" | "operator" | "staff" | string
  tenant: { id: number; name: string; slug: string; status: string } | null
  facilities: TenantFacility[]
  facility_ids: number[]
  station_id: number | null
}

interface TenantContextValue {
  user: TenantUser | null
  facilities: TenantFacility[]
  activeFacility: TenantFacility | null
  activeFacilityId: number | null
  setActiveFacilityId: (id: number) => void
  isLoading: boolean
  error: string
  refresh: () => Promise<void>
}

const TenantContext = createContext<TenantContextValue | null>(null)

const FACILITY_COOKIE = "kiyu_facility_id"

function readFacilityCookie(): number | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${FACILITY_COOKIE}=(\\d+)`)
  )
  return match ? Number(match[1]) : null
}

function writeFacilityCookie(id: number) {
  document.cookie = `${FACILITY_COOKIE}=${id}; path=/; max-age=2592000; samesite=lax`
}

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<TenantUser | null>(null)
  const [activeFacilityId, setActiveFacilityIdState] = useState<number | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/session/me", {
        credentials: "include",
        cache: "no-store",
      })
      if (res.status === 401) {
        router.replace("/login")
        return
      }
      if (!res.ok) {
        throw new Error("Failed to load session")
      }
      const data = (await res.json()) as { user: TenantUser }
      setUser(data.user)
      setError("")

      // Facility selection: cookie > single accessible facility > first
      const stored = readFacilityCookie()
      const validIds = new Set(data.user.facility_ids)
      const chosen =
        stored !== null && validIds.has(stored)
          ? stored
          : data.user.facility_ids.length > 0
            ? data.user.facility_ids[0]
            : null
      setActiveFacilityIdState(chosen)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load session")
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    ;(async () => {
      await load()
    })()
  }, [load])

  const setActiveFacilityId = useCallback(
    (id: number) => {
      writeFacilityCookie(id)
      setActiveFacilityIdState(id)
      router.refresh()
    },
    [router]
  )

  const facilities = user?.facilities ?? []
  const activeFacility =
    facilities.find((f) => f.id === activeFacilityId) ?? null

  return (
    <TenantContext.Provider
      value={{
        user,
        facilities,
        activeFacility,
        activeFacilityId,
        setActiveFacilityId,
        isLoading,
        error,
        refresh: load,
      }}
    >
      {children}
    </TenantContext.Provider>
  )
}

export function useTenantContext(): TenantContextValue {
  const ctx = useContext(TenantContext)
  if (!ctx) {
    throw new Error("useTenantContext must be used within TenantProvider")
  }
  return ctx
}
