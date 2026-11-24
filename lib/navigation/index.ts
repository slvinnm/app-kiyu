import { normalizeRole } from "@/types/auth"

import { clientNavigation } from "@/lib/navigation/configs/client.navigation"
import { facilityAdminNavigation } from "@/lib/navigation/configs/facility-admin.navigation"
import { operatorNavigation } from "@/lib/navigation/configs/operator.navigation"
import { platformAdminNavigation } from "@/lib/navigation/configs/platform-admin.navigation"
import { staffNavigation } from "@/lib/navigation/configs/staff.navigation"
import { tenantAdminNavigation } from "@/lib/navigation/configs/tenant-admin.navigation"

import type { BreadcrumbItem, NavItem, NavigationConfig } from "@/lib/navigation/types"
import type { UserRole } from "@/types/auth"

/**
 * The one place a role is mapped to its navigation config. Each config lives in
 * its own file (PRD §9) so a role's menu is edited in isolation; this registry
 * only selects between them.
 */
const REGISTRY: Record<UserRole, NavigationConfig> = {
  platform_admin: platformAdminNavigation,
  tenant_admin: tenantAdminNavigation,
  facility_admin: facilityAdminNavigation,
  operator: operatorNavigation,
  staff: staffNavigation,
  client: clientNavigation,
}

/** Navigation config for a raw role, or `null` when the role is unknown. */
export function getNavigationConfig(role: unknown): NavigationConfig | null {
  const normalized = normalizeRole(role)

  return normalized ? REGISTRY[normalized] : null
}

/** Navigable items for a role; `[]` fails closed for an unknown role. */
export function getNavigation(role: unknown): NavItem[] {
  return getNavigationConfig(role)?.items ?? []
}

/** Which application context a role belongs to, for host/route guards. */
export function applicationOf(role: unknown): "portal" | "workspace" | null {
  const normalized = normalizeRole(role)

  if (normalized === null) {
    return null
  }

  return normalized === "platform_admin" || normalized === "tenant_admin"
    ? "portal"
    : "workspace"
}

function findNavigationPath(
  items: NavItem[],
  pathname: string
): BreadcrumbItem[] | null {
  for (const item of items) {
    if (!item.url) {
      continue
    }

    const isMatch = pathname === item.url || pathname.startsWith(`${item.url}/`)

    if (!isMatch) {
      continue
    }

    if (item.items?.length) {
      const childPath = findNavigationPath(item.items, pathname)

      if (childPath) {
        return [{ title: item.title, href: item.url }, ...childPath]
      }
    }

    return [{ title: item.title }]
  }

  return null
}

/** Breadcrumbs for a pathname within a role's navigation tree. */
export function getBreadcrumbsForRole(
  role: unknown,
  pathname: string
): BreadcrumbItem[] {
  const config = getNavigationConfig(role)

  if (config === null) {
    return []
  }

  const breadcrumbs: BreadcrumbItem[] = [
    { title: config.label, href: config.dashboardPath },
  ]

  const routePath = findNavigationPath(config.items, pathname)

  if (routePath) {
    breadcrumbs.push(...routePath)
  }

  return breadcrumbs
}

/**
 * Breadcrumbs resolved from the pathname alone.
 *
 * Safe in a client component (no role needed): every config has a distinct
 * `basePath`, so the first path segment identifies the workspace. Used by the
 * shared header, which must not depend on the cookie (HttpOnly).
 */
export function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const basePath = pathname.split("/").filter(Boolean)[0] ?? ""
  const config = Object.values(REGISTRY).find(
    (candidate) => candidate.basePath === basePath
  )

  if (config === undefined) {
    return []
  }

  const breadcrumbs: BreadcrumbItem[] = [
    { title: config.label, href: config.dashboardPath },
  ]

  const routePath = findNavigationPath(config.items, pathname)

  if (routePath) {
    breadcrumbs.push(...routePath)
  }

  return breadcrumbs
}

export { REGISTRY as navigationRegistry }
