import {
  Activity,
  BadgeDollarSign,
  Building2,
  CalendarClock,
  FileText,
  LayoutDashboardIcon,
  LifeBuoy,
  ReceiptText,
  ScrollText,
  Settings2,
  Wallet,
} from "lucide-react"

import type { NavigationConfig } from "@/lib/navigation/types"

/**
 * PlatformAdmin navigation (PRD §8.1).
 *
 * The SaaS business console: tenants, subscriptions, money, plans, reports.
 * It must never contain queue-operations menus — those belong to tenant users.
 */
export const platformAdminNavigation: NavigationConfig = {
  basePath: "platform",
  label: "KIYU Platform",
  dashboardPath: "/platform/dashboard",
  items: [
    {
      title: "Dasbor Platform",
      url: "/platform/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Manajemen Tenant",
      icon: <Building2 />,
      items: [
        {
          title: "Daftar Tenant",
          url: "/platform/tenants",
          icon: <Building2 />,
        },
      ],
    },
    {
      title: "Langganan",
      icon: <CalendarClock />,
      items: [
        {
          title: "Daftar Langganan",
          url: "/platform/subscriptions",
          icon: <CalendarClock />,
        },
      ],
    },
    {
      title: "Transaksi & Pembayaran",
      icon: <Wallet />,
      items: [
        {
          title: "Daftar Transaksi",
          url: "/platform/payments",
          icon: <ReceiptText />,
        },
        {
          title: "Riwayat Webhook",
          url: "/platform/payments/webhooks",
          icon: <Activity />,
        },
      ],
    },
    {
      title: "Paket & Entitlements",
      icon: <BadgeDollarSign />,
      items: [
        {
          title: "Daftar Paket",
          url: "/platform/plans",
          icon: <BadgeDollarSign />,
        },
      ],
    },
    {
      title: "Laporan SaaS",
      icon: <FileText />,
      items: [
        {
          title: "Laporan Pendapatan",
          url: "/platform/reports/revenue",
          icon: <Wallet />,
        },
        {
          title: "Pertumbuhan Tenant",
          url: "/platform/reports/growth",
          icon: <Activity />,
        },
        {
          title: "Laporan Langganan",
          url: "/platform/reports/subscriptions",
          icon: <CalendarClock />,
        },
      ],
    },
    {
      title: "Support & Akses Tenant",
      icon: <LifeBuoy />,
      items: [
        {
          title: "Riwayat Support Access",
          url: "/platform/support",
          icon: <LifeBuoy />,
        },
      ],
    },
    {
      title: "Platform Audit Log",
      url: "/platform/audit-logs",
      icon: <ScrollText />,
    },
    {
      title: "Pengaturan Platform",
      url: "/platform/settings",
      icon: <Settings2 />,
    },
  ],
}
