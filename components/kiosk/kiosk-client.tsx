"use client"

import type { Department, KioskCheckinResult, KioskState } from "@/types/kiosk"

import { useCallback, useEffect, useRef, useState } from "react"
import { KioskApiError, acquireQueue, getDepartments } from "@/lib/api/kiosk"
import { Spinner } from "@/components/ui/spinner"
import { KioskHeader } from "@/components/kiosk/kiosk-header"
import { DepartmentGrid } from "@/components/kiosk/department-grid"
import { KioskInformation } from "@/components/kiosk/kiosk-information"
import { OnlineCheckinPanel } from "@/components/kiosk/online-checkin-panel"
import { SuccessScreen } from "@/components/kiosk/success-screen"
import { ErrorScreen } from "@/components/kiosk/error-screen"
import { SUCCESS_RESET_DELAY } from "@/lib/api/kiosk"
import { KioskOnboarding } from "@/components/kiosk/kiosk-onboarding"
import { clearKioskDevice, readKioskDevice } from "@/lib/kiosk/device"

import type { KioskPairedDevice } from "@/lib/kiosk/device"

type KioskMode = "walk-in" | "online"

export function KioskClient() {
  /**
   * `undefined` until the storage check runs. Rendering the kiosk before the
   * check would flash the department grid on an unpaired device.
   */
  const [device, setDevice] = useState<KioskPairedDevice | null | undefined>(
    undefined
  )

  const [departments, setDepartments] = useState<Department[]>([])
  const [loadingDepartments, setLoadingDepartments] = useState(true)
  const [departmentError, setDepartmentError] = useState<string | null>(null)

  const [mode, setMode] = useState<KioskMode>("walk-in")

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
    setMode("walk-in")
    setState({ type: "idle" })
  }, [clearResetTimer])

  const loadDepartments = useCallback(async () => {
    setLoadingDepartments(true)
    setDepartmentError(null)

    try {
      const data = await getDepartments()

      setDepartments(data)
    } catch (error) {
      // A revoked or expired credential means this device must pair again.
      // Drop the stored credential so the onboarding screen appears.
      if (error instanceof KioskApiError && error.status === 403) {
        clearKioskDevice()
        setDevice(null)
        return
      }

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
    const paired = readKioskDevice()

    setDevice(paired)

    if (paired) {
      void loadDepartments()
    }

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
        const intake = await acquireQueue(department.id, idempotencyKey)

        setState({
          type: "success",
          result: { visit: intake.data.visit, ticket: intake.data.ticket },
          message: intake.message ?? "Nomor antrean berhasil diambil.",
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

  const handleCheckedIn = useCallback(
    (result: KioskCheckinResult, message?: string) => {
      setState({
        type: "success",
        result: { visit: result.visit, ticket: result.ticket },
        message: message ?? "Check-in berhasil. Silakan menunggu panggilan.",
      })

      setSecondsRemaining(SUCCESS_RESET_DELAY)

      clearResetTimer()

      resetTimer.current = window.setTimeout(() => {
        resetKiosk()
      }, SUCCESS_RESET_DELAY * 1000)
    },
    [clearResetTimer, resetKiosk]
  )

  const selectedDepartment =
    state.type === "loading" || state.type === "error"
      ? (departments.find(
          (department) => department.code === state.departmentCode
        ) ?? null)
      : null

  if (device === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="size-6 text-muted-foreground" />
      </main>
    )
  }

  if (device === null) {
    return (
      <KioskOnboarding
        onPaired={(paired) => {
          setDevice(paired)
          void loadDepartments()
        }}
      />
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 md:px-10 md:py-8">
        <KioskHeader />

        <section className="flex flex-1 items-center justify-center">
          {state.type === "success" ? (
            <SuccessScreen
              result={state.result}
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
          ) : mode === "online" ? (
            <OnlineCheckinPanel
              onBack={() => setMode("walk-in")}
              onCheckedIn={handleCheckedIn}
            />
          ) : (
            <div className="w-full space-y-6">
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

              <div className="mx-auto max-w-xl">
                <button
                  type="button"
                  onClick={() => setMode("online")}
                  className="w-full rounded-2xl border border-dashed bg-card p-5 text-center transition-colors hover:border-primary/50 hover:bg-muted/50"
                >
                  <p className="text-sm font-semibold">
                    Sudah melakukan booking online?
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Check-in di sini dengan kode booking Anda untuk masuk
                    antrean reception.
                  </p>
                </button>
              </div>
            </div>
          )}
        </section>

        <KioskInformation />
      </div>
    </main>
  )
}
