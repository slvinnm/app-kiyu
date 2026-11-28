// Centralized environment configuration
// All environment variables should be accessed through this module

export const env = {
  // API Configuration
  apiBaseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://api.kiyu.test/api",

  // Host Configuration (for generating absolute URLs)
  publicHost: process.env.NEXT_PUBLIC_PUBLIC_HOST ?? "kiyu.test",
  appHost: process.env.NEXT_PUBLIC_APP_HOST ?? "app.kiyu.test",
  portalHost: process.env.NEXT_PUBLIC_PORTAL_HOST ?? "portal.kiyu.test",

  // Feature Flags
  enableMockData: process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === "true",

  // Analytics/Tracking (if needed)
  analyticsId: process.env.NEXT_PUBLIC_ANALYTICS_ID,

  // Application Metadata
  appName: "KIYU",
  appDescription: "Multi-tenant Queue Management SaaS",
} as const

export type Env = typeof env

// Helper to get full API URL for a context
export function getApiUrl(
  context: "public" | "app" | "tenant" | "customer" | "portal",
  path: string
): string {
  const base = env.apiBaseUrl.replace(/\/$/, "")
  const prefix = context === "public" ? "/public" : `/${context}`
  return `${base}${prefix}${path.startsWith("/") ? path : `/${path}`}`
}

// Helper to get frontend host URL for a context
export function getHostUrl(
  context: "public" | "app" | "portal",
  tenantSlug?: string
): string {
  switch (context) {
    case "public":
      return `https://${env.publicHost}`
    case "app":
      return `https://${env.appHost}`
    case "portal":
      return `https://${env.portalHost}`
    default:
      if (tenantSlug) {
        return `https://${tenantSlug}.${env.publicHost.replace("kiyu.test", "kiyu.test")}` // {tenant}.kiyu.test
      }
      return `https://${env.publicHost}`
  }
}

// Route prefixes per context (internal routing)
export const ROUTE_PREFIXES = {
  public: "/",
  app: "/app",
  portal: "/portal",
  tenant: "/workspace",
  customer: "/customer",
  kiosk: "/kiosk",
  display: "/display",
} as const

// Cookie names per auth context
export const AUTH_COOKIES = {
  app: "kiyu_app",
  tenant: "kiyu_tenant",
  customer: "kiyu_customer",
  portal: "kiyu_portal",
  kiosk: "kiyu_kiosk",
  display: "kiyu_display",
} as const
