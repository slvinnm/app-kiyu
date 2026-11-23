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

const navigation: Record<UserRole, NavItem[]> = {
  admin: [
    {
      title: "Dasbor",
      url: "/admin/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Organisasi",
      icon: <Building2 />,
      items: [
        { title: "Poli", url: "/admin/departments", icon: <Building2 /> },
        { title: "Station", url: "/admin/stations", icon: <MapPin /> },
        { title: "Workflow", url: "/admin/workflows", icon: <GitBranch /> },
        { title: "Staff", url: "/admin/users", icon: <UserCog /> },
        { title: "Fasilitas", url: "/admin/facilities", icon: <Building2 /> },
        { title: "Kiosk", url: "/admin/kiosk-devices", icon: <Ticket /> },
        { title: "Display", url: "/admin/display-devices", icon: <MonitorPlay /> },
      ],
    },
    {
      title: "Operasional",
      icon: <CalendarClock />,
      items: [
        { title: "Kunjungan", url: "/admin/visits", icon: <CalendarClock /> },
        { title: "Referral", url: "/admin/referrals", icon: <ArrowRightLeft /> },
        { title: "Antrian", url: "/admin/queue", icon: <ListOrdered /> },
      ],
    },
    {
      title: "Klien",
      url: "/admin/clients",
      icon: <Users />,
    },
    {
      title: "Laporan",
      icon: <FileText />,
      items: [
        { title: "Ringkasan", url: "/admin/reports", icon: <FileText /> },
        { title: "Billing", url: "/admin/billing", icon: <ScrollText /> },
      ],
    },
    {
      title: "Audit Log",
      url: "/admin/audit-logs",
      icon: <ScrollText />,
    },
  ],

  receptionist: [
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
      title: "Antrian",
      url: "/receptionist/queue",
      icon: <Ticket />,
    },
    {
      title: "Klien",
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
      title: "Antrian",
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
      title: "Kunjungan",
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

const roleLabels: Record<string, string> = {
  admin: "Admin",
  receptionist: "Resepsionis",
  staff: "Staff",
  client: "Klien",
}

const roleDashboardPaths: Record<string, string> = {
  admin: "/admin/dashboard",
  receptionist: "/receptionist/dashboard",
  staff: "/staff/dashboard",
  client: "/client/dashboard",
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
