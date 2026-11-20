"use client"

import { useEffect } from "react"
import { BellRingIcon } from "lucide-react"

import type { CalledTicketEvent } from "@/hooks/use-public-queue"

const AUTO_DISMISS_MS = 12_000

export function CallPopup({
  event,
  onDismiss,
  onlyDepartmentCode,
}: {
  event: CalledTicketEvent | null
  onDismiss: () => void
  /** When set, only announce calls for this department (per-dept display). */
  onlyDepartmentCode?: string
}) {
  const visible =
    event !== null &&
    (!onlyDepartmentCode ||
      (event.departmentCode ?? "").toLowerCase() ===
        onlyDepartmentCode.toLowerCase())

  useEffect(() => {
    if (!visible) {
      return
    }

    const timer = window.setTimeout(onDismiss, AUTO_DISMISS_MS)

    return () => window.clearTimeout(timer)
    // Re-arm the timer each time a new call arrives (nonce changes).
  }, [visible, event?.nonce, onDismiss])

  if (!visible || !event) {
    return null
  }

  return (
    <div
      role="alertdialog"
      aria-live="assertive"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <div className="w-full max-w-3xl rounded-3xl border border-emerald-400/40 bg-neutral-900 p-10 text-center text-neutral-100 shadow-2xl ring-1 ring-emerald-400/20 animate-in fade-in zoom-in-95 duration-300">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-500 text-neutral-950">
          <BellRingIcon className="size-8" />
        </div>

        <p className="mt-5 text-sm font-semibold tracking-[0.25em] text-emerald-400 uppercase">
          Nomor Antrian Dipanggil
        </p>

        <p className="mt-2 text-8xl leading-none font-black tracking-tight text-emerald-400 tabular-nums md:text-9xl">
          {event.queueNumber}
        </p>

        <p className="mt-6 text-xl font-semibold text-neutral-200">
          Silakan menuju{" "}
          <span className="text-white">
            {event.stationName ?? event.stationCode ?? "loket layanan"}
          </span>
        </p>

        {event.departmentName && (
          <p className="mt-1 text-sm text-neutral-400">
            {event.departmentName}
          </p>
        )}

        <p className="mt-8 text-xs text-neutral-500">
          Ketuk layar atau tunggu beberapa detik untuk menutup
        </p>
      </div>
    </div>
  )
}
