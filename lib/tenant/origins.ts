import { ROOT_DOMAIN } from "@/lib/tenant/host"

/**
 * Public application origins, derived from the root domain.
 *
 * `ROOT_DOMAIN` is `kiyu.test` locally and `kiyu.id` in production. The scheme
 * follows the environment: HTTPS in production, HTTP locally.
 */
const SCHEME = process.env.NODE_ENV === "production" ? "https" : "http"

/** The Platform Portal origin (`app.kiyu.test`). */
export const PORTAL_ORIGIN = `${SCHEME}://app.${ROOT_DOMAIN}`

/** Absolute URL of a tenant workspace (`acme.kiyu.test`). */
export function tenantOrigin(slug: string): string {
  return `${SCHEME}://${slug}.${ROOT_DOMAIN}`
}
