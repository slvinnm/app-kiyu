import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { resolveHost } from "@/lib/host-routing/resolve-host"
import { lookupTenant } from "@/lib/host-routing/tenant-lookup"

/**
 * Next.js 16 Proxy for host-based multi-domain routing & context isolation
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // 1. Guard against direct access to internal /ctx/* routes
  if (pathname.startsWith("/ctx/") || pathname === "/ctx") {
    return NextResponse.rewrite(new URL("/not-found", request.url))
  }

  // 2. Resolve host header to application context and internal base path
  const hostHeader = request.headers.get("host")
  const match = resolveHost(hostHeader, pathname)

  if (!match) {
    return NextResponse.rewrite(new URL("/not-found", request.url))
  }

  const { context, tenantSlug, internalBasePath } = match

  // 3. For tenant subdomains, validate tenant through public API
  let tenantRegistrationAllowed = false
  let tenantId = ""
  let tenantName = ""
  let tenantTimezone = ""

  if (tenantSlug) {
    try {
      const lookup = await lookupTenant(tenantSlug)

      if (lookup.state === "NOT_FOUND") {
        return NextResponse.rewrite(new URL("/not-found", request.url))
      }

      if (lookup.state === "UNAVAILABLE") {
        return NextResponse.rewrite(new URL("/ctx/unavailable", request.url))
      }

      tenantRegistrationAllowed = Boolean(
        lookup.tenant.allow_public_registration
      )
      tenantId = String(lookup.tenant.id)
      tenantName = lookup.tenant.name
      tenantTimezone = lookup.tenant.timezone
    } catch {
      return NextResponse.rewrite(new URL("/ctx/unavailable", request.url))
    }
  }

  // 4. Compute destination internal path preserving query params
  let rewrittenPath = pathname === "/" ? "" : pathname

  if (context === "customer") {
    const subPath = pathname.replace(/^\/customer(\/|$)/, "/")
    rewrittenPath = subPath === "/" ? "" : subPath
  }

  const destination = `${internalBasePath}${rewrittenPath}${search}`

  // 5. Clone request headers and inject context metadata
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-kiyu-context", context)
  if (tenantSlug) {
    requestHeaders.set("x-kiyu-tenant-slug", tenantSlug)
    requestHeaders.set("x-kiyu-tenant-id", tenantId)
    requestHeaders.set("x-kiyu-tenant-name", tenantName)
    requestHeaders.set("x-kiyu-tenant-timezone", tenantTimezone)
    requestHeaders.set(
      "x-kiyu-tenant-allow-reg",
      tenantRegistrationAllowed ? "1" : "0"
    )
  }

  // 6. Rewrite to internal destination route
  const rewriteUrl = new URL(destination, request.url)
  return NextResponse.rewrite(rewriteUrl, {
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (BFF / auth route handlers)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
}
