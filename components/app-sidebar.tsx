import { getFacilitiesServer } from "@/lib/api/admin-server"
import { getSession } from "@/lib/auth/session"
import { getFacilityContext } from "@/lib/facility/context"
import { getNavigation } from "@/lib/navigation"
import { normalizeRole } from "@/types/auth"

import { FacilitySwitcher } from "@/components/facility-switcher"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { CommandIcon } from "lucide-react"

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const session = await getSession()
  const role = normalizeRole(session?.user?.role)

  if (!session?.user || !role) {
    return null
  }

  const items = getNavigation(role)
  const facilityContext = await getFacilityContext()

  // Only an administrator may list facilities; an operator sees just their own
  // assignment, so the switcher falls back to the numeric reference.
  const facilities =
    facilityContext.facilityIds.length > 1
      ? await getFacilitiesServer()
          .then((rows) =>
            rows
              .filter((row) => facilityContext.facilityIds.includes(row.id))
              .map((row) => ({ id: row.id, name: row.name }))
          )
          .catch(() =>
            facilityContext.facilityIds.map((id) => ({ id, name: `Fasilitas #${id}` }))
          )
      : facilityContext.facilityIds.map((id) => ({ id, name: "Fasilitas" }))

  const user = {
    name: session.user.name ?? "",
    email: session.user.email ?? "",
    avatar: "",
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="#" />}
            >
              <CommandIcon className="size-5!" />
              <span className="text-base font-semibold">KIYU</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        <FacilitySwitcher
          facilities={facilities}
          activeId={facilityContext.activeId}
        />

        <NavMain items={items} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
