import type { NextConfig } from "next"

/**
 * Baseline security headers for every response.
 *
 * `frame-ancestors 'none'` blocks clickjacking of the admin/reception consoles;
 * the remaining headers are standard hardening (no MIME sniffing, no referrer
 * leakage of tracking-token URLs, HSTS in production only so local HTTP dev
 * still works). A full CSP is intentionally omitted — it needs per-route
 * nonces and would break the dev server without tuning.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'",
  },
  ...(process.env.NODE_ENV === "production"
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
]

const nextConfig: NextConfig = {
  allowedDevOrigins: ["app-kiyu.test"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
}

export default nextConfig
