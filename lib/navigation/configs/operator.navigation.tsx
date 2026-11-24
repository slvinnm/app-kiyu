import { LayoutDashboardIcon, ListOrdered, Users } from "lucide-react"

import type { NavigationConfig } from "@/lib/navigation/types"

/**
 * Operator navigation (PRD §8.4).
 *
 * Manual registration is a modal inside Antrean, not a menu. No Service
 * Transfer, no standalone Registration page.
 */
export const operatorNavigation: NavigationConfig = {
  basePath: "operator",
  label: "Operator",
  dashboardPath: "/operator/dashboard",
  items: [
    {
      title: "Dasbor",
      url: "/operator/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    { title: "Antrean", url: "/operator/queue", icon: <ListOrdered /> },
    { title: "Pelanggan", url: "/operator/customers", icon: <Users /> },
  ],
}
