import type { ReactNode } from "react"

/**
 * Shape of one navigation entry.
 *
 * `items` makes it a group; a leaf has a `url`. Icons are React nodes because
 * the configs are plain data and are rendered by one shared sidebar.
 */
export type NavItem = {
  title: string
  url?: string
  icon?: ReactNode
  /** Nested entries; when present this is a collapsible group. */
  items?: NavItem[]
  /** Hidden unless the account holds the capability (rendering only). */
  capability?: string
}

export type BreadcrumbItem = {
  title: string
  href?: string
}

/**
 * One application context's navigation: its base path (used to build
 * breadcrumbs and dashboard links) and its tree.
 */
export type NavigationConfig = {
  /** URL prefix this workspace lives under, e.g. `portal`. */
  basePath: string
  label: string
  /** Landing dashboard path for the role. */
  dashboardPath: string
  items: NavItem[]
}
