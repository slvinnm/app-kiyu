import {
  Building2,
  CalendarClock,
  CreditCard,
  FileText,
  LayoutDashboardIcon,
  ListOrdered,
  ReceiptText,
  ScrollText,
  Users,
} from "lucide-react"

import type { NavigationConfig } from "@/lib/navigation/types"

/**
 * TenantAdmin navigation in the Platform Portal (PRD §8.2).
 *
 * Organisation → Facilities hierarchy, organization-wide monitoring, and the
 * tenant's own billing. TenantAdmin does not call queues here.
 */
export const tenantAdminNavigation: NavigationConfig = {
  basePath: "portal",
  label: "Organisasi",
  dashboardPath: "/portal/dashboard",
  items: [
    {
      title: "Dasbor",
      url: "/portal/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Organisasi",
      icon: <Building2 />,
      items: [
        {
          title: "Fasilitas",
          url: "/portal/facilities",
          icon: <Building2 />,
        },
      ],
    },
    {
      title: "Operasional",
      icon: <ListOrdered />,
      items: [
        {
          title: "Sesi Antrean",
          url: "/portal/queue-sessions",
          icon: <CalendarClock />,
        },
        {
          title: "Antrean",
          url: "/portal/queue",
          icon: <ListOrdered />,
        },
      ],
    },
    { title: "Pelanggan", url: "/portal/customers", icon: <Users /> },
    {
      title: "Laporan",
      url: "/portal/reports",
      icon: <FileText />,
      feature: "basic_reports",
    },
    { title: "Audit Log", url: "/portal/audit-logs", icon: <ScrollText /> },
    {
      title: "Billing",
      icon: <CreditCard />,
      items: [
        {
          title: "Langganan Saya",
          url: "/portal/billing",
          icon: <CreditCard />,
        },
        {
          title: "Riwayat Pembayaran",
          url: "/portal/billing/payments",
          icon: <ReceiptText />,
        },
      ],
    },
  ],
}
