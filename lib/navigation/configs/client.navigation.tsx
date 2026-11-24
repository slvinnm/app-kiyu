import {
  CalendarPlus,
  FileText,
  LayoutDashboardIcon,
  UserRound,
} from "lucide-react"

import type { NavigationConfig } from "@/lib/navigation/types"

/** Client navigation (PRD §8.6). Preserved as-is. */
export const clientNavigation: NavigationConfig = {
  basePath: "client",
  label: "Customer Portal",
  dashboardPath: "/client/dashboard",
  items: [
    {
      title: "Dasbor",
      url: "/client/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Kunjungan",
      icon: <FileText />,
      items: [
        { title: "Daftar Kunjungan", url: "/client/visits", icon: <FileText /> },
      ],
    },
    { title: "Booking Online", url: "/client/booking", icon: <CalendarPlus /> },
    { title: "Profil", url: "/client/profile", icon: <UserRound /> },
  ],
}
