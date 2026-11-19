import { normalizeRole } from "@/types/auth"

import type { UserRole } from "@/types/auth"
import {
  BugPlay,
  Headset,
  LayoutDashboardIcon,
  SearchIcon,
  UsersIcon,
  UserPlus,
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
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Caller",
      url: "/admin/caller",
      icon: <Headset />,
    },
    {
      title: "Search",
      url: "/admin/search",
      icon: <SearchIcon />,
      items: [
        {
          title: "Patients",
          url: "/admin/search/patients",
          icon: <UsersIcon />,
        },
        {
          title: "Users",
          url: "/admin/search/users",
          icon: <UsersIcon />,
        },
      ],
    },
    {
      title: "Test Page",
      url: "/test",
      icon: <BugPlay />,
    },
  ],

  staff: [
    {
      title: "Dashboard",
      url: "/staff/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Search",
      url: "/staff/search",
      icon: <SearchIcon />,
      items: [
        {
          title: "Patients",
          url: "/staff/search/patients",
        },
      ],
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
      title: "Dashboard",
      url: "/patient/dashboard",
      icon: <LayoutDashboardIcon />,
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
  doctor: "Dokter",
  nurse: "Perawat",
  pharmacy: "Farmasi",
  lab: "Lab",
  patient: "Patient",
}

const roleDashboardPaths: Record<string, string> = {
  admin: "/admin/dashboard",
  receptionist: "/receptionist/dashboard",
  staff: "/staff/dashboard",
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
