import { getVerifiedUser } from "@/lib/auth/guard"
import { getSession } from "@/lib/auth/session"
import { getFacilityContext } from "@/lib/facility/context"
import { filterNavigationByEntitlements, getNavigation } from "@/lib/navigation"
import { getEntitlementsServer } from "@/lib/api/admin-server"
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
import { BuildingIcon, CommandIcon, StoreIcon } from "lucide-react"

/**
 * Sidebar shell.
 *
 * The header identifies *where the user is*: a TenantAdmin sees the
 * organization, a FacilityAdmin/Operator/Staff sees their active facility, and
 * a Client sees the organization they belong to (PRD §8, §9). Navigation is
 * role-specific (`lib/navigation`).
 */
export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const session = await getSession()
  const role = normalizeRole(session?.user?.role)

  if (!session?.user || !role) {
    return null
  }

  const user = await getVerifiedUser()
  const facilityContext = await getFacilityContext()

  // Hide menus the tenant's subscription does not include. Only tenant roles
  // have plan entitlements; the platform console is never plan-gated.
  const portalHasPlan = role !== "platform_admin"
  const entitlements = portalHasPlan ? await getEntitlementsServer() : null
  const items = filterNavigationByEntitlements(
    getNavigation(role),
    entitlements
  )

  // Portal roles are tenant/organization wide → show the tenant name.
  const isPortalRole = role === "platform_admin" || role === "tenant_admin"
  const tenant = user?.tenant ?? session.user.tenant ?? null

  // Workspace roles act at one facility → resolve the active facility's name
  // from the facilities the API attached to the account (no extra request).
  const facilities = (user?.facilities ?? session.user.facilities ?? []).map(
    (row) => ({ id: row.id, name: row.name })
  )
  const activeFacility =
    facilities.find((row) => row.id === facilityContext.activeId) ??
    facilities[0] ??
    null

  let headerTitle: string
  let headerSubtitle: string
  let HeaderIcon = CommandIcon

  if (isPortalRole) {
    headerTitle = tenant?.name ?? "KIYU Platform"
    headerSubtitle = role === "platform_admin" ? "Platform Admin" : "Organisasi"
    HeaderIcon = BuildingIcon
  } else {
    headerTitle = activeFacility?.name ?? tenant?.name ?? "KIYU"
    headerSubtitle = activeFacility ? "Fasilitas aktif" : (tenant?.name ?? "")
    HeaderIcon = StoreIcon
  }

  const navUser = {
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
              size="lg"
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="#" />}
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HeaderIcon className="size-4" />
              </div>

              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-semibold">
                  {headerTitle}
                </span>

                {headerSubtitle && (
                  <span className="truncate text-xs text-muted-foreground">
                    {headerSubtitle}
                  </span>
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        {!isPortalRole && facilities.length > 1 && (
          <FacilitySwitcher
            facilities={facilities}
            activeId={facilityContext.activeId}
          />
        )}

        <NavMain items={items} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={navUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
