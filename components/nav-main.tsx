"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"

import type { NavItem } from "@/lib/navigation"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname()

  function isActive(url?: string) {
    if (!url) {
      return false
    }

    return pathname === url || pathname.startsWith(`${url}/`)
  }

  function hasActiveChild(item: NavItem): boolean {
    return (
      item.items?.some(
        (child) => isActive(child.url) || hasActiveChild(child)
      ) ?? false
    )
  }

  function NavItem({ item }: { item: NavItem }) {
    const active = isActive(item.url)
    const activeChild = hasActiveChild(item)
    const isParentActive = active || activeChild
    const hasChildren = Boolean(item.items?.length)

    const [open, setOpen] = useState(activeChild)

    useEffect(() => {
      if (activeChild) {
        setOpen(true)
      }
    }, [activeChild, pathname])

    if (!hasChildren) {
      return (
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip={item.title}
            isActive={active}
            render={item.url ? <Link href={item.url} /> : undefined}
          >
            {item.icon}
            <span>{item.title}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )
    }

    return (
      <Collapsible
        open={open}
        onOpenChange={setOpen}
        className="group/collapsible"
      >
        <SidebarMenuItem>
          <CollapsibleTrigger
            render={
              <SidebarMenuButton
                tooltip={item.title}
                isActive={isParentActive}
              />
            }
          >
            {item.icon}

            <span>{item.title}</span>

            <ChevronRight className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
          </CollapsibleTrigger>

          <CollapsibleContent>
            <SidebarMenuSub>
              {item.items?.map((child) => (
                <SidebarMenuSubItem key={child.title}>
                  <SidebarMenuSubButton
                    isActive={isActive(child.url)}
                    render={child.url ? <Link href={child.url} /> : undefined}
                  >
                    {child.icon}

                    <span>{child.title}</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    )
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <NavItem key={item.title} item={item} />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
