"use client"

import Echo from "laravel-echo"
import Pusher from "pusher-js"

type EchoClient = InstanceType<typeof Echo>

let client: EchoClient | null = null

/**
 * Lazily creates a Reverb (Pusher-protocol) Echo client for public display
 * screens. Uses the `public.queue` channel so no authentication is required.
 */
export function getEcho(): EchoClient | null {
  if (typeof window === "undefined") {
    return null
  }

  const key = process.env.NEXT_PUBLIC_REVERB_KEY

  if (!key) {
    return null
  }

  if (!client) {
    ;(window as unknown as { Pusher: unknown }).Pusher = Pusher

    const scheme = process.env.NEXT_PUBLIC_REVERB_SCHEME ?? "https"
    const port = Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 443)

    client = new Echo({
      broadcaster: "reverb",
      key,
      wsHost: process.env.NEXT_PUBLIC_REVERB_HOST ?? window.location.hostname,
      wsPort: port,
      wssPort: port,
      forceTLS: scheme === "https",
      enabledTransports: ["ws", "wss"],
      disableStats: true,
    })
  }

  return client
}

export const PUBLIC_QUEUE_CHANNEL = "public.queue"
