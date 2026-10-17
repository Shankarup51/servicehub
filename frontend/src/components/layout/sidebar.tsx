"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { NavigationSection, NavigationItem } from "@/features/navigation/navigation.types"
import { navigationIconMap } from "@/features/navigation/navigation.data"

export interface SidebarProps {
  sections: NavigationSection[]
  user?: {
    name?: string
    email?: string
    role?: string
  }
  onLogout?: () => void
  className?: string
}

export function Sidebar({
  sections,
  user,
  onLogout,
  className,
}: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = React.useState(false)

  const renderItem = (item: NavigationItem) => {
    const IconComponent = item.icon ? navigationIconMap[item.icon] : null
    const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))

    return (
      <Link
        key={item.id}
        href={item.href}
        aria-current={isActive ? "page" : undefined}
        title={collapsed ? item.title : undefined}
        className={cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 outline-none",
          isActive
            ? "bg-primary text-primary-foreground shadow-xs"
            : "text-foreground/80 hover:bg-muted hover:text-foreground",
          item.disabled && "pointer-events-none opacity-40",
          collapsed && "justify-center px-2"
        )}
      >
        {IconComponent && (
          <IconComponent
            className={cn(
              "size-4.5 shrink-0 transition-colors",
              isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
            )}
          />
        )}

        {!collapsed && <span className="truncate flex-1">{item.title}</span>}

        {!collapsed && item.badge && (
          <span
            className={cn(
              "ml-auto text-xs font-semibold px-2 py-0.5 rounded-full",
              isActive
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-primary/10 text-primary"
            )}
          >
            {item.badge}
          </span>
        )}
      </Link>
    )
  }

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out shrink-0",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Toggle collapse button */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 z-20 flex size-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-xs hover:text-foreground focus:outline-none"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="size-3.5" />
        ) : (
          <ChevronLeft className="size-3.5" />
        )}
      </button>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-6 space-y-6">
        {sections.map((section) => (
          <div key={section.id} className="space-y-1">
            {section.title && !collapsed && (
              <h4 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">
                {section.title}
              </h4>
            )}
            <div className="space-y-1">
              {section.items.map((item) => renderItem(item))}
            </div>
          </div>
        ))}
      </div>

      {/* User section & Logout */}
      {user && (
        <div className="border-t border-border p-3">
          <div
            className={cn(
              "flex items-center gap-3 rounded-lg p-2 transition-colors",
              collapsed ? "justify-center" : "justify-between"
            )}
          >
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.name || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.role || user.email}
                </p>
              </div>
            )}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Log out"
                className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-md hover:bg-destructive/10"
              >
                <LogOut className="size-4" />
                <span className="sr-only">Log out</span>
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}
