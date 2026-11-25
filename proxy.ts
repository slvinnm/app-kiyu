import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import {
  SESSION_COOKIE_NAME,
  readSessionFromRequest,
} from "@/lib/auth/session-core"
import { routeContextOf } from "@/lib/auth/route-access"
import { classifyHost, requestHostname } from "@/lib/tenant/host"
import { resolveTenantAvailability } from "@/lib/tenant/availability"

/**
 * Clears the session cookie and sends the browser to the login page.
 */
function reject(request: NextRequest, pathname: string, search: string) {
  const loginUrl = new URL("/login", request.url)
  loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`)

  const response = NextResponse.redirect(loginUrl)
  response.cookies.delete(SESSION_COOKIE_NAME)

  return response
}

/** A genuine HTML 404. The proxy is where the status can still be set. */
function notFound(reason: string): NextResponse {
  const html = `<!doctype html>
<html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>404 — Tidak Ditemukan</title>
<style>
  :root{color-scheme:light dark}
  body{margin:0;min-height:100svh;display:flex;align-items:center;justify-content:center;
       font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
       background:#fafafa;color:#18181b;padding:2rem}
  @media (prefers-color-scheme:dark){body{background:#09090b;color:#fafafa}}
  main{max-width:32rem;text-align:center}
  .code{font-size:.875rem;color:#71717a;letter-spacing:.08em;text-transform:uppercase}
  h1{margin:.5rem 0 0;font-size:1.5rem;font-weight:600;letter-spacing:-.01em}
  p{margin:.75rem 0 0;font-size:.9rem;color:#71717a;line-height:1.6}
</style></head>
<body><main>
  <div class="code">404</div>
  <h1>Tidak Ditemukan</h1>
  <p>${reason}</p>
</main></body></html>`

  return new NextResponse(html, {
    status: 404,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  })
}

/**
 * Edge gate (PRD §3.4, §6.1, §7).
 *
 * Responsibilities, in order:
 *  1. classify the host and refuse an unknown/API host with a real 404;
 *  2. refuse a cross-application path (portal route on a tenant host or the
 *     reverse) with a 404 rather than leaking the other frontend;
 *  3. on a tenant host, refuse an unknown tenant slug with a real 404 and an
 *     unavailable (suspended) tenant with a 403 — before rendering streams;
 *  4. for a gated path, require only that a signed cookie exists; the *role* and
 *     *application* authorization happen in each layout (`requireRole`), which
 *     reads the account from the API. The cookie's claims are never trusted here.
 */
export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const host = classifyHost(requestHostname(request.headers))

  // The bare host is the marketing site; render `app/marketing` without
  // changing the URL. Every other path keeps working as before.
  if (pathname === "/" && host.kind === "marketing") {
    return NextResponse.rewrite(new URL("/marketing", request.url))
  }

  if (host.kind === "unknown" || host.kind === "api") {
    return notFound("Alamat ini tidak melayani aplikasi KIYU.")
  }

  const context = routeContextOf(pathname)

  if (context === "portal" && host.kind !== "portal") {
    return notFound("Halaman ini berada di portal aplikasi.")
  }

  if (context === "workspace" && host.kind !== "tenant") {
    return notFound("Halaman ini berada di ruang kerja organisasi.")
  }

  // Kiosk, display, and tracking are tenant-scoped surfaces. On any non-tenant
  // host they are refused outright, so the central portal and marketing sites
  // cannot serve another tenant's device or tracking page (PRD §7).
  if (context === "tenant-public" && host.kind !== "tenant") {
    return notFound("Halaman ini hanya tersedia melalui subdomain organisasi.")
  }

  // Tenant existence/availability is proven before any document streams, which
  // is the only way to return a genuine 404 (PRD §7.7).
  if (host.kind === "tenant") {
    const availability = await resolveTenantAvailability(host.slug)

    if (availability.status === 404) {
      return notFound(`Organisasi "${host.slug}" tidak ditemukan.`)
    }

    if (availability.status === 403) {
      return new NextResponse(
        "Organisasi ini sedang tidak tersedia. Hubungi administrator organisasi Anda.",
        {
          status: 403,
          headers: { "content-type": "text/plain; charset=utf-8" },
        }
      )
    }
  }

  const session = readSessionFromRequest(request)
  const isAuthPage = pathname === "/login" || pathname === "/signup"

  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/redirect", request.url))
  }

  if (context === null) {
    return NextResponse.next()
  }

  if (!session) {
    return reject(request, pathname, search)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
      // Server actions carry `next-action`; they must run their own guard
      // (the layout `requireRole`) rather than be redirected mid-action.
      missing: [
        {
          type: "header",
          key: "next-action",
        },
      ],
    },
  ],
}
