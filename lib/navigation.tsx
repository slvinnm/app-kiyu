import { normalizeRole } from "@/types/auth"

import type { UserRole } from "@/types/auth"
import {
  Building2,
  CalendarClock,
  CalendarPlus,
  FileText,
  GitBranch,
  LayoutDashboardIcon,
  ListOrdered,
  MapPin,
  ScrollText,
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
        {
          title: "Poli",
          url: "/admin/departments",
          icon: <Building2 />,
        },
        {
          title: "Station",
          url: "/admin/stations",
          icon: <MapPin />,
        },
        {
          title: "Workflow",
          url: "/admin/workflows",
          icon: <GitBranch />,
        },
      ],
    },
    {
      title: "Operasional",
      icon: <CalendarClock />,
      items: [
        {
          title: "Kunjungan",
          url: "/admin/visits",
          icon: <CalendarClock />,
        },
        {
          title: "Antrian",
          url: "/admin/queue",
          icon: <ListOrdered />,
        },
      ],
    },
    {
      title: "Pasien",
      url: "/admin/patients",
      icon: <Users />,
    },
    {
      title: "Audit Log",
      url: "/admin/audit-logs",
      icon: <ScrollText />,
    },
  ],

  doctor: [
    {
      title: "Dasbor",
      url: "/doctor/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Antrian",
      url: "/doctor/queue",
      icon: <Ticket />,
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
      title: "Pasien",
      url: "/receptionist/patients",
      icon: <Users />,
    },
  ],

  nurse: [
    {
      title: "Dasbor",
      url: "/nurse/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Antrian",
      url: "/nurse/queue",
      icon: <Ticket />,
    },
  ],

  pharmacy: [
    {
      title: "Dasbor",
      url: "/pharmacy/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Antrian",
      url: "/pharmacy/queue",
      icon: <Ticket />,
    },
  ],

  lab: [
    {
      title: "Dasbor",
      url: "/lab/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Antrian",
      url: "/lab/queue",
      icon: <Ticket />,
    },
  ],

  patient: [
    {
      title: "Dasbor",
      url: "/patient/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Kunjungan",
      url: "/patient/visits",
      icon: <FileText />,
    },
    {
      title: "Booking Online",
      url: "/patient/booking",
      icon: <CalendarPlus />,
    },
    {
      title: "Profil",
      url: "/patient/profile",
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
  doctor: "Dokter",
  nurse: "Perawat",
  pharmacy: "Farmasi",
  lab: "Lab",
  patient: "Pasien",
}

const roleDashboardPaths: Record<string, string> = {
  admin: "/admin/dashboard",
  receptionist: "/receptionist/dashboard",
  doctor: "/doctor/dashboard",
  nurse: "/nurse/dashboard",
  pharmacy: "/pharmacy/dashboard",
  lab: "/lab/dashboard",
  patient: "/patient/dashboard",
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
