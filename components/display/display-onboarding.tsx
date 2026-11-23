"use client"

import { useState } from "react"
import { MonitorPlay } from "lucide-react"

import { DisplayClock } from "@/components/display/display-clock"

import { pairDisplayDevice } from "@/lib/api/display"
import { saveDisplayDevice } from "@/lib/display/device"

import type { DisplayPairedDevice } from "@/lib/display/device"

const CODE_LENGTH = 8

/**
 * Shown when this screen has no display credential. The operator types the
 * pairing code an admin generated; the screen trades it for a credential and
 * stores it locally.
 *
 * Styled dark to match the display shell, so a TV never flashes a white screen.
 */
export function DisplayOnboarding({
  onPaired,
}: {
  onPaired: (device: DisplayPairedDevice) => void
}) {
  const [code, setCode] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalized = code.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()

    if (normalized.length !== CODE_LENGTH) {
      setError(`Kode pairing harus ${CODE_LENGTH} karakter.`)
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const result = await pairDisplayDevice(normalized)
      const paired = {
        credential: result.credential,
        device: result.device,
      }

      saveDisplayDevice(paired)
      onPaired(paired)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Gagal memasangkan layar display."
      )
      setCode("")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-neutral-950 text-neutral-100">
      <header className="border-b border-white/10">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500 text-neutral-950">
              <MonitorPlay className="size-6" />
            </div>

            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-neutral-400 uppercase">
                Kiyu
              </p>
              <h1 className="text-2xl font-bold tracking-tight">
                Pendaftaran Layar
              </h1>
            </div>
          </div>

          <DisplayClock />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-xl font-semibold">Layar ini belum terdaftar</h2>

          <p className="mt-2 text-sm text-neutral-400">
            Masukkan kode pairing 8 karakter yang dibuat admin di menu Layar
            Display. Kode hanya bisa dipakai sekali.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              value={code}
              onChange={(event) => {
                setCode(
                  event.target.value
                    .replace(/[^a-zA-Z0-9]/g, "")
                    .toUpperCase()
                    .slice(0, CODE_LENGTH)
                )
                setError(null)
              }}
              placeholder="A1B2C3D4"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              autoFocus
              disabled={submitting}
              className="w-full rounded-xl border border-white/15 bg-neutral-900 px-4 py-4 text-center font-mono text-3xl tracking-[0.4em] text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none disabled:opacity-60"
            />

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || code.length !== CODE_LENGTH}
              className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-neutral-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Memasangkan..." : "Daftarkan Layar"}
            </button>
          </form>

          <p className="mt-4 text-xs text-neutral-500">
            Kode kedaluwarsa setelah 30 menit. Minta admin membuat kode baru bila
            sudah lewat.
          </p>
        </div>
      </main>
    </div>
  )
}
