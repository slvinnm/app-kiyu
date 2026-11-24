import { normalizeRole } from "@/types/auth"

import type { UserRole } from "@/types/auth"
import {
  ArrowRightLeft,
  Building2,
  CalendarClock,
  CalendarPlus,
  FileText,
  GitBranch,
  LayoutDashboardIcon,
  ListOrdered,
  MapPin,
  MonitorPlay,
  ScrollText,
  UserCog,
  UserPlus,
  UserRound,
  Ticket,
  Users,
} from "lucide-react"

export type NavItem = {
  title: string
  url?: string
  icon?: React.ReactNode
  items?: NavItem[]
}

/** Shared admin tree; billing is tenant-owner only, so it is added separately. */
const adminNavBase: NavItem[] = [
  {
    title: "Dasbor",
    url: "/admin/dashboard",
    icon: <LayoutDashboardIcon />,
  },
  {
    title: "Organisasi",
    icon: <Building2 />,
    items: [
      { title: "Departemen", url: "/admin/departments", icon: <Building2 /> },
      { title: "Loket", url: "/admin/stations", icon: <MapPin /> },
      { title: "Alur Layanan", url: "/admin/workflows", icon: <GitBranch /> },
      { title: "Pengguna", url: "/admin/users", icon: <UserCog /> },
      { title: "Fasilitas", url: "/admin/facilities", icon: <Building2 /> },
      { title: "Kiosk", url: "/admin/kiosk-devices", icon: <Ticket /> },
      {
        title: "Display",
        url: "/admin/display-devices",
        icon: <MonitorPlay />,
      },
    ],
  },
  {
    title: "Operasional",
    icon: <CalendarClock />,
    items: [
      { title: "Sesi Antrean", url: "/admin/visits", icon: <CalendarClock /> },
      {
        title: "Transfer Layanan",
        url: "/admin/referrals",
        icon: <ArrowRightLeft />,
      },
      { title: "Antrean", url: "/admin/queue", icon: <ListOrdered /> },
    ],
  },
  {
    title: "Pelanggan",
    url: "/admin/clients",
    icon: <Users />,
  },
  {
    title: "Laporan",
    url: "/admin/reports",
    icon: <FileText />,
  },
  {
    title: "Audit Log",
    url: "/admin/audit-logs",
    icon: <ScrollText />,
  },
]

/** Billing and subscription are owner-only (PRD §3.2). */
const billingNavItem: NavItem = {
  title: "Billing",
  url: "/admin/billing",
  icon: <ScrollText />,
}

const navigation: Record<UserRole, NavItem[]> = {
  // The platform console is a separate area that does not exist yet.
  platform_admin: [],

  tenant_admin: [...adminNavBase, billingNavItem],

  facility_admin: adminNavBase,

  operator: [
    {
      title: "Dasbor",
      url: "/receptionist/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Registrasi",
      url: "/receptionist/registration",
      icon: <UserPlus />,
    },
    {
      title: "Antrean",
      url: "/receptionist/queue",
      icon: <Ticket />,
    },
    {
      title: "Pelanggan",
      url: "/receptionist/clients",
      icon: <Users />,
    },
  ],

  staff: [
    {
      title: "Dasbor",
      url: "/staff/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Antrean",
      url: "/staff/queue",
      icon: <Ticket />,
    },
  ],

  client: [
    {
      title: "Dasbor",
      url: "/client/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Sesi Antrean",
      url: "/client/visits",
      icon: <FileText />,
    },
    {
      title: "Booking Online",
      url: "/client/booking",
      icon: <CalendarPlus />,
    },
    {
      title: "Profil",
      url: "/client/profile",
      icon: <UserRound />,
    },
  ],
}

export function getNavigation(role: unknown): NavItem[] {
  const normalizedRole = normalizeRole(role)

  if (!normalizedRole) {
    return []
  }

  return navigation[normalizedRole]
}

export type BreadcrumbItem = {
  title: string
  href?: string
}

/**
 * Breadcrumb roots are keyed by URL prefix, not role: each workspace owns one
 * prefix and several roles may share it (tenant_admin and facility_admin both
 * live under `/admin`).
 */
const prefixLabels: Record<string, string> = {
  admin: "Admin",
  receptionist: "Operator",
  staff: "Staff",
  client: "Klien",
}

const prefixDashboardPaths: Record<string, string> = {
  admin: "/admin/dashboard",
  receptionist: "/receptionist/dashboard",
  staff: "/staff/dashboard",
  client: "/client/dashboard",
}

const roleLabels = prefixLabels
const roleDashboardPaths = prefixDashboardPaths

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
        return [
          {
            title: item.title,
            href: item.url,
          },
          ...childPath,
        ]
      }
    }

    return [
      {
        title: item.title,
      },
    ]
  }

  return null
}

function formatPathSegment(segment: string) {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean)
  const role = segments[0]

  const roleLabel = roleLabels[role]
  const dashboardPath = roleDashboardPaths[role]

  let routePath: BreadcrumbItem[] | null = null

  for (const items of Object.values(navigation)) {
    routePath = findNavigationPath(items, pathname)

    if (routePath) {
      break
    }
  }

  const breadcrumbs: BreadcrumbItem[] = []

  if (roleLabel) {
    breadcrumbs.push({
      title: roleLabel,
      href: dashboardPath,
    })
  }

  if (routePath) {
    breadcrumbs.push(...routePath)
  } else if (segments.length > 0) {
    breadcrumbs.push({
      title: formatPathSegment(segments[segments.length - 1]),
    })
  }

  return breadcrumbs
}
