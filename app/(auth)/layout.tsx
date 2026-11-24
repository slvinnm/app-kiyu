import { redirect } from "next/navigation"

import { getHostContext } from "@/lib/auth/guard"
import { PORTAL_ORIGIN } from "@/lib/tenant/origins"

/**
 * Login / signup page shell.
 *
 * Authentication is an application action: it happens on the Portal host
 * (`app.kiyu.test/...`) or a Tenant host (`acme.kiyu.test/login`). On the bare
 * marketing host these pages are not served — the visitor is sent to the Portal
 * instead, which keeps the two session contexts from collapsing into one
 * (PRD §6.1, §6.2).
 */
export default async function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const host = await getHostContext()

  if (host.kind === "marketing") {
    redirect(`${PORTAL_ORIGIN}/login`)
  }

  if (host.kind === "unknown" || host.kind === "api") {
    // The proxy already 404s these hosts; this is defence in depth.
    redirect(`${PORTAL_ORIGIN}/login`)
  }

  return children
}
