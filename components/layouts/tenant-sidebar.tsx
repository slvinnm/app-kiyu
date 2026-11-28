"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

export interface NavItem {
  href: string
  label: string
}

export interface NavSeparator {
  type: "separator"
}

type NavEntry = NavItem | NavSeparator

const ROLE_NAV: Record<string, NavEntry[]> = {
  facility_admin: [
    { href: "/facility/dashboard", label: "Dashboard" },
    { href: "/facility/reception", label: "Reception" },
    { href: "/facility/queue-monitor", label: "Queue Monitor" },
    { href: "/facility/queue-acquisitions", label: "Queue Acquisitions" },
    { href: "/facility/tickets", label: "Tickets" },
    { href: "/facility/queue-sessions", label: "Queue Sessions" },
    { href: "/facility/customers", label: "Customers" },
    { type: "separator" },
    { href: "/facility/departments", label: "Departments" },
    { href: "/facility/stations", label: "Stations" },
    { href: "/facility/workflows", label: "Workflows" },
    { href: "/facility/devices", label: "Devices" },
    { type: "separator" },
    { href: "/facility/reports", label: "Reports" },
  ],
  operator: [
    { href: "/operator/reception", label: "Reception" },
    { href: "/operator/queue-monitor", label: "Queue Monitor" },
    { href: "/operator/queue-acquisitions", label: "Queue Acquisitions" },
    { href: "/operator/tickets", label: "Tickets" },
    { href: "/operator/customers", label: "Customers" },
    { type: "separator" },
    { href: "/operator/reports", label: "Reports" },
  ],
  staff: [{ href: "/staff", label: "Service Workstation" }],
}

export function TenantSidebar({
  tenantName,
  tenantSlug,
  role,
  facilities,
  activeFacilityId,
}: {
  tenantName: string
  tenantSlug: string
  role: string
  facilities: Array<{ id: number; name: string; code: string }>
  activeFacilityId: number | null
}) {
  const pathname = usePathname()
  const router = useRouter()
  const items = ROLE_NAV[role] ?? ROLE_NAV.facility_admin

  async function handleFacilityChange(facilityId: number) {
    // Persist selection for this user/session via cookie; server-side scoped data refetches
    document.cookie = `kiyu_facility_id=${facilityId}; path=/; max-age=2592000; samesite=lax`
    router.refresh()
  }

  return (
    <aside className="hidden w-64 flex-col border-r bg-background lg:flex">
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/" className="truncate text-lg font-semibold">
          {tenantName}
        </Link>
      </div>

      {facilities.length > 1 && (
        <div className="border-b p-4">
          <label
            htmlFor="facility-select"
            className="mb-2 block text-xs font-medium text-muted-foreground"
          >
            Active Facility
          </label>
          <select
            id="facility-select"
            value={activeFacilityId?.toString() ?? ""}
            onChange={(e) => void handleFacilityChange(Number(e.target.value))}
            className="flex w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none"
          >
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.code})
              </option>
            ))}
          </select>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="flex flex-col gap-1">
          {items.map((item, idx) => {
            if ("type" in item) {
              return (
                <li key={`sep-${idx}`} aria-hidden="true">
                  <hr className="my-2 border-muted" />
                </li>
              )
            }
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground">{tenantSlug}</p>
      </div>
    </aside>
  )
}
