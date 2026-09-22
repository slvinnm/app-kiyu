import { useEffect, useState } from "react"
import { toast } from "sonner"

import { ApiError } from "@/lib/api/error"
import { getReceptionDepartments } from "@/lib/api/reception"

import type { Department } from "@/types/reception"

export function useReceptionDepartments() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDepartments() {
      try {
        const response = await getReceptionDepartments()

        setDepartments(response.data)
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : "Gagal memuat daftar department."

        toast.error(message)
      } finally {
        setLoading(false)
      }
    }

    loadDepartments()
  }, [])

  return {
    departments,
    loading,
  }
}
