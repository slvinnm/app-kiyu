import {
  ArrowRightLeft,
  LayoutDashboardIcon,
  ListOrdered,
  Ticket,
} from "lucide-react"

import type { NavigationConfig } from "@/lib/navigation/types"

/**
 * Staff navigation (PRD §8.5).
 *
 * Queue processing and the Staff-only Service Transfer. No manual
 * registration, no customer management.
 */
export const staffNavigation: NavigationConfig = {
  basePath: "staff",
  label: "Staff",
  dashboardPath: "/staff/dashboard",
  items: [
    {
      title: "Dasbor",
      url: "/staff/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Antrean",
      icon: <ListOrdered />,
      items: [
        { title: "Daftar Tiket", url: "/staff/queue", icon: <Ticket /> },
        {
          title: "Transfer Layanan",
          url: "/staff/transfers",
          icon: <ArrowRightLeft />,
        },
      ],
    },
  ],
}
