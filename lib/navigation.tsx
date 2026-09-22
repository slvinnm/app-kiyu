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
      title: "Dashboard",
      url: "/staff/dashboard",
      icon: <LayoutDashboardIcon />,
    },
  ],

  receptionist: [
    {
      title: "Dashboard",
      url: "/receptionist/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Registration",
      url: "/receptionist/registration",
      icon: <UserPlus />,
    },
    {
      title: "Queue",
      url: "/receptionist/queue",
      icon: <Ticket />,
    },
    {
      title: "Patient",
      url: "/receptionist/patient",
      icon: <Users />,
    },
  ],

  nurse: [
    {
      title: "Dashboard",
      url: "/staff/dashboard",
      icon: <LayoutDashboardIcon />,
    },
  ],

  pharmacy: [
    {
      title: "Dashboard",
      url: "/staff/dashboard",
      icon: <LayoutDashboardIcon />,
    },
  ],

  lab: [
    {
      title: "Dashboard",
      url: "/staff/dashboard",
      icon: <LayoutDashboardIcon />,
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

export function getNavigation(role: UserRole) {
  return navigation[role]
}

export type BreadcrumbItem = {
  title: string
  href?: string
}

const roleLabels: Record<string, string> = {
  admin: "Admin",
  receptionist: "Receptionist",
  staff: "Staff",
  doctor: "Doctor",
  nurse: "Nurse",
  pharmacy: "Pharmacy",
  lab: "Lab",
  patient: "Patient",
}

const roleDashboardPaths: Record<string, string> = {
  admin: "/admin/dashboard",
  receptionist: "/receptionist/dashboard",
  staff: "/staff/dashboard",
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
