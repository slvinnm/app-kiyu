import { useEffect, useState } from "react"
import { toast } from "sonner"

import { ApiError } from "@/lib/api/error"
import { getReceptionPatients } from "@/lib/api/reception"

import type { Patient } from "@/types/reception"

export function useReceptionPatientSearch(search: string) {
  const [results, setResults] = useState<Patient[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    const query = search.trim()

    if (!query) {
      setResults([])
      setSearching(false)
      return
    }

    let active = true
    const controller = new AbortController()

    const timeout = setTimeout(async () => {
      setSearching(true)

      try {
        const response = await getReceptionPatients(query, controller.signal)

        if (active) {
          setResults(response.data)
        }
      } catch (error) {
        if (!active || controller.signal.aborted) {
          return
        }

        const message =
          error instanceof ApiError ? error.message : "Gagal mencari pasien."

        toast.error(message)
        setResults([])
      } finally {
        if (active) {
          setSearching(false)
        }
      }
    }, 400)

    return () => {
      active = false
      clearTimeout(timeout)
      controller.abort()
    }
  }, [search])

  return {
    results,
    searching,
  }
}
