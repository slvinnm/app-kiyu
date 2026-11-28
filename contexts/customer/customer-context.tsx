"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import { useRouter } from "next/navigation"

export interface CustomerUser {
  id: number
  name: string
  email: string
  role: string
  tenant: {
    id: number
    name: string
    slug: string
    status: string
    timezone?: string
  } | null
  profile: {
    id: number
    name: string
    phone: string | null
    email: string | null
    address: string | null
  } | null
}

interface CustomerContextValue {
  user: CustomerUser | null
  isLoading: boolean
  error: string
  refresh: () => Promise<void>
}

const CustomerContext = createContext<CustomerContextValue | null>(null)

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<CustomerUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/session/me", {
        credentials: "include",
        cache: "no-store",
      })
      if (res.status === 401) {
        router.replace("/login?mode=customer")
        return
      }
      if (!res.ok) {
        throw new Error("Failed to load session")
      }
      const data = (await res.json()) as { user: CustomerUser }
      setUser(data.user)
      setError("")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load session")
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    const timer = setTimeout(() => {
      void load()
    }, 0)
    return () => clearTimeout(timer)
  }, [load])

  return (
    <CustomerContext.Provider value={{ user, isLoading, error, refresh: load }}>
      {children}
    </CustomerContext.Provider>
  )
}

export function useCustomerContext(): CustomerContextValue {
  const ctx = useContext(CustomerContext)
  if (!ctx) {
    throw new Error("useCustomerContext must be used within CustomerProvider")
  }
  return ctx
}
