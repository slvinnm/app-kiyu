import type { UserRole } from "@/types/auth"
import {
  BugPlay,
  Headset,
  LayoutDashboardIcon,
  SearchIcon,
  UsersIcon,
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
      url: "/staff/dashboard",
      icon: <LayoutDashboardIcon />,
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
