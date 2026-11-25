import {
  Building2,
  FileText,
  LayoutDashboardIcon,
  MonitorPlay,
  ScrollText,
  Ticket,
} from "lucide-react"

import type { NavigationConfig } from "@/lib/navigation/types"

/**
 * FacilityAdmin navigation in the Tenant Workspace (PRD §8.3).
 *
 * Scoped to the selected Facility. No billing, no organisation ownership.
 */
export const facilityAdminNavigation: NavigationConfig = {
  basePath: "facility",
  label: "Fasilitas",
  dashboardPath: "/facility/dashboard",
  items: [
    {
      title: "Dasbor",
      url: "/facility/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    // Loket and Alur Layanan are tabs of a department's detail page, not
    // separate sidebar entries (PRD §8.3).
    // Departments contain Loket, Alur Layanan and Pengguna as tabs (PRD §8.3).
    { title: "Departemen", url: "/facility/departments", icon: <Building2 /> },
    {
      title: "Perangkat",
      icon: <MonitorPlay />,
      items: [
        { title: "Kiosk", url: "/facility/kiosk-devices", icon: <Ticket /> },
        {
          title: "Display",
          url: "/facility/display-devices",
          icon: <MonitorPlay />,
        },
      ],
    },
    { title: "Laporan", url: "/facility/reports", icon: <FileText /> },
    { title: "Audit Log", url: "/facility/audit-logs", icon: <ScrollText /> },
  ],
}
