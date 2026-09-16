"use client"

import type { Department, KioskState } from "@/types/kiosk"

import { useCallback, useEffect, useRef, useState } from "react"
import { acquireQueue, getDepartments } from "@/lib/api/kiosk"
import { KioskHeader } from "@/components/kiosk/kiosk-header"
import { DepartmentGrid } from "@/components/kiosk/department-grid"
import { KioskInformation } from "@/components/kiosk/kiosk-information"
import { SuccessScreen } from "@/components/kiosk/success-screen"
import { ErrorScreen } from "@/components/kiosk/error-screen"
import { SUCCESS_RESET_DELAY } from "@/lib/api/kiosk"

export function KioskClient() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loadingDepartments, setLoadingDepartments] = useState(true)
  const [departmentError, setDepartmentError] = useState<string | null>(null)

  const [state, setState] = useState<KioskState>({
    type: "idle",
  })

  const [secondsRemaining, setSecondsRemaining] = useState(SUCCESS_RESET_DELAY)

  const activeIdempotencyKey = useRef<string | null>(null)
  const resetTimer = useRef<number | null>(null)

  const clearResetTimer = useCallback(() => {
    if (resetTimer.current === null) {
      return
    }

    window.clearTimeout(resetTimer.current)
    resetTimer.current = null
  }, [])

  const resetKiosk = useCallback(() => {
    clearResetTimer()

    activeIdempotencyKey.current = null

    setSecondsRemaining(SUCCESS_RESET_DELAY)
    setState({ type: "idle" })
  }, [clearResetTimer])

  const loadDepartments = useCallback(async () => {
    setLoadingDepartments(true)
    setDepartmentError(null)

    try {
      const data = await getDepartments()

      setDepartments(data)
    } catch (error) {
      setDepartmentError(
        error instanceof Error
          ? error.message
          : "Tidak dapat terhubung ke server."
      )
    } finally {
      setLoadingDepartments(false)
    }
  }, [])

  useEffect(() => {
    void loadDepartments()

    return () => {
      clearResetTimer()
    }
  }, [loadDepartments, clearResetTimer])

  useEffect(() => {
    if (state.type !== "success") {
      return
    }

    const interval = window.setInterval(() => {
      setSecondsRemaining((seconds) => {
        if (seconds <= 1) {
          window.clearInterval(interval)
          return 0
        }

        return seconds - 1
      })
    }, 1000)

    return () => {
      window.clearInterval(interval)
    }
  }, [state.type])

  const handleAcquireQueue = useCallback(
    async (department: Department, retry = false) => {
      if (!retry || !activeIdempotencyKey.current) {
        activeIdempotencyKey.current = crypto.randomUUID()
      }

      const idempotencyKey = activeIdempotencyKey.current

      if (!idempotencyKey) {
        setState({
          type: "error",
          message: "Gagal membuat permintaan antrean.",
          departmentCode: department.code,
        })

        return
      }

      setState({
        type: "loading",
        departmentCode: department.code,
      })

      try {
        const acquisition = await acquireQueue(department.code, idempotencyKey)

        setState({
          type: "success",
          acquisition: acquisition.data,
          message: acquisition.message,
        })

        setSecondsRemaining(SUCCESS_RESET_DELAY)

        clearResetTimer()

        resetTimer.current = window.setTimeout(() => {
          resetKiosk()
        }, SUCCESS_RESET_DELAY * 1000)
      } catch (error) {
        setState({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Terjadi kesalahan saat mengambil nomor antrean.",
          departmentCode: department.code,
        })
      }
    },
    [clearResetTimer, resetKiosk]
  )

  const selectedDepartment =
    state.type === "loading" || state.type === "error"
      ? (departments.find(
          (department) => department.code === state.departmentCode
        ) ?? null)
      : null

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 md:px-10 md:py-8">
        <KioskHeader />

        <section className="flex flex-1 items-center justify-center">
          {state.type === "success" ? (
            <SuccessScreen
              acquisition={state.acquisition}
              message={state.message}
              secondsRemaining={secondsRemaining}
              onReset={resetKiosk}
            />
          ) : state.type === "error" ? (
            <ErrorScreen
              message={state.message}
              department={selectedDepartment}
              onRetry={() => {
                if (!selectedDepartment) {
                  resetKiosk()
                  return
                }

                void handleAcquireQueue(selectedDepartment, true)
              }}
              onReset={resetKiosk}
            />
          ) : (
            <DepartmentGrid
              departments={departments}
              loading={loadingDepartments}
              error={departmentError}
              state={state}
              onRetry={loadDepartments}
              onSelect={(department) => {
                void handleAcquireQueue(department)
              }}
            />
          )}
        </section>

        <KioskInformation />
      </div>
    </main>
  )
}
