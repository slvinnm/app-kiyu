import {
  Building2,
  FileText,
  GitBranch,
  LayoutDashboardIcon,
  MapPin,
  MonitorPlay,
  ScrollText,
  Ticket,
  UserCog,
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
    {
      title: "Departemen",
      icon: <Building2 />,
      items: [
        {
          title: "Daftar Departemen",
          url: "/facility/departments",
          icon: <Building2 />,
        },
        { title: "Loket", url: "/facility/stations", icon: <MapPin /> },
        {
          title: "Alur Layanan",
          url: "/facility/workflows",
          icon: <GitBranch />,
        },
      ],
    },
    { title: "Pengguna", url: "/facility/users", icon: <UserCog /> },
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
