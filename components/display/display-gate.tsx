"use client"

import { useEffect, useState } from "react"

import { DisplayOnboarding } from "@/components/display/display-onboarding"

import { readDisplayDevice } from "@/lib/display/device"

import type { DisplayPairedDevice } from "@/lib/display/device"

/**
 * Wraps a display screen and renders the onboarding flow until this browser has
 * a display credential.
 *
 * The check runs in an effect, not during render, so server and client markup
 * agree; a brief dark placeholder avoids flashing a white screen on a TV.
 */
export function DisplayGate({ children }: { children: React.ReactNode }) {
  const [device, setDevice] = useState<DisplayPairedDevice | null | undefined>(
    undefined
  )

  useEffect(() => {
    setDevice(readDisplayDevice())
  }, [])

  if (device === undefined) {
    return <div className="min-h-svh bg-neutral-950" />
  }

  if (device === null) {
    return <DisplayOnboarding onPaired={setDevice} />
  }

  return <>{children}</>
}
