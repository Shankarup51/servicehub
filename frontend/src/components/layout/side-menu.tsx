"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Compass,
  LogOut,
  Sparkles,
  Shield,
  CircleDot,
} from "lucide-react"

import { useGetNavigationMenuQuery } from "@/features/navigation/navigation.api"
import { navigationIconMap } from "@/features/navigation/navigation.data"
import { ServerMenuItem } from "@/features/navigation/navigation.types"
import { useAppSelector } from "@/lib/hooks"
import { useLogoutMutation } from "@/features/auth/auth.api"
import { Skeleton } from "@/components/feedback/skeleton"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface SideMenuProps {
  currentRole?: "CUSTOMER" | "SERVICE_PROVIDER" | "ADMIN"
  onNavigate?: () => void
  className?: string
  showHeader?: boolean
  showUserFooter?: boolean
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function SideMenu({
  currentRole = "CUSTOMER",
  onNavigate,
  className,
  showHeader = false,
  showUserFooter = true,
  isCollapsed = false,
  onToggleCollapse,
}: SideMenuProps) {
  const router = useRouter()
  const pathname = usePathname()
  const authUser = useAppSelector((state) => state.auth.user)
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation()

  // Fetch dynamic RBAC-filtered navigation items from backend menu API
  const { data: navData, isLoading: isNavLoading, isError: isNavError } = useGetNavigationMenuQuery()

  // Track expanded state for menu items with children
  const [expandedItems, setExpandedItems] = React.useState<Record<string, boolean>>({})

  // Toggle child menu accordion
  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Predefined role-based menu fallbacks if API is offline or returns error
  const fallbackMenu: ServerMenuItem[] = React.useMemo(() => {
    if (currentRole === "SERVICE_PROVIDER") {
      return [
        { id: "provider-dashboard", label: "Dashboard", route: "/dashboard/provider", icon: "dashboard" },
        { id: "provider-services", label: "My Services", route: "/provider/services", icon: "services" },
        { id: "provider-bookings", label: "Bookings", route: "/provider/bookings", icon: "bookings" },
        { id: "provider-settings", label: "Settings", route: "/settings", icon: "settings" },
      ]
    }

    if (currentRole === "ADMIN") {
      return [
        { id: "admin-dashboard", label: "Dashboard", route: "/admin", icon: "dashboard" },
        { id: "admin-users", label: "Users", route: "/admin/users", icon: "users" },
        { id: "admin-providers", label: "Providers", route: "/admin/providers", icon: "providers" },
        { id: "admin-services", label: "Services", route: "/admin/services", icon: "services" },
        { id: "admin-bookings", label: "Bookings", route: "/admin/bookings", icon: "bookings" },
      ]
    }

    // Default Customer Menu
    return [
      { id: "customer-dashboard", label: "Dashboard", route: "/dashboard", icon: "dashboard" },
      { id: "explore", label: "Find Services", route: "/services", icon: "explore" },
      { id: "categories", label: "Categories", route: "/categories", icon: "categories" },
      { id: "bookings", label: "My Bookings", route: "/bookings", icon: "bookings" },
      { id: "settings", label: "Profile Settings", route: "/settings", icon: "settings" },
    ]
  }, [currentRole])

  // Resolved menu items from API or fallback when offline/error
  const menuItems: ServerMenuItem[] = React.useMemo(() => {
    if (navData?.items !== undefined) {
      return navData.items
    }
    if (isNavError) {
      return fallbackMenu
    }
    return []
  }, [navData, isNavError, fallbackMenu])

  // Auto-expand parents if active route is inside a child item
  React.useEffect(() => {
    if (!menuItems || !pathname) return

    menuItems.forEach((item) => {
      if (item.children && item.children.length > 0) {
        const hasActiveChild = item.children.some(
          (child) => pathname === (child.route || child.href)
        )
        if (hasActiveChild) {
          setExpandedItems((prev) => ({ ...prev, [item.id]: true }))
        }
      }
    })
  }, [menuItems, pathname])

  const handleLogout = async () => {
    try {
      await logout().unwrap()
    } finally {
      if (onNavigate) onNavigate()
      router.replace("/")
    }
  }

  // Helper to render an individual menu item
  const renderMenuItem = (item: ServerMenuItem, isChild = false) => {
    const itemRoute = item.route || item.href || "#"
    const isExactActive = pathname === itemRoute
    const isParentActive =
      itemRoute !== "#" && itemRoute !== "/" && pathname.startsWith(itemRoute)
    const isActive = isExactActive || isParentActive

    const hasChildren = Array.isArray(item.children) && item.children.length > 0
    const isExpanded = expandedItems[item.id] ?? false

    const IconComponent = item.icon
      ? navigationIconMap[item.icon.toLowerCase()] || CircleDot
      : Compass

    const itemLabel = item.label || item.title

    if (hasChildren && !isCollapsed) {
      return (
        <div key={item.id} className="space-y-1">
          <button
            type="button"
            onClick={() => toggleExpand(item.id)}
            title={itemLabel}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all group cursor-pointer",
              isActive
                ? "bg-[#AD8066]/10 text-[#AD8066] font-semibold"
                : "text-[#242424] hover:bg-[#F5F5F5] hover:text-[#AD8066]"
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <IconComponent
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  isActive ? "text-[#AD8066]" : "text-[#6B6B6B] group-hover:text-[#AD8066]"
                )}
              />
              <span className="truncate">{itemLabel}</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {item.badge && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#AD8066]/15 text-[#AD8066]">
                  {item.badge}
                </span>
              )}
              {isExpanded ? (
                <ChevronDown className="size-3.5 text-[#6B6B6B]" />
              ) : (
                <ChevronRight className="size-3.5 text-[#6B6B6B]" />
              )}
            </div>
          </button>

          {isExpanded && item.children && (
            <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-[#E5E5E5] ml-4">
              {item.children.map((child) => renderMenuItem(child, true))}
            </div>
          )}
        </div>
      )
    }

    return (
      <Link
        key={item.id}
        href={itemRoute}
        onClick={onNavigate}
        title={itemLabel}
        className={cn(
          "flex items-center rounded-xl text-xs sm:text-sm font-medium transition-all group relative",
          isCollapsed
            ? "justify-center p-2.5"
            : cn("justify-between px-3 py-2.5", isChild ? "text-xs py-2" : ""),
          isExactActive
            ? "bg-[#AD8066] text-white shadow-xs font-semibold"
            : isActive
            ? "bg-[#AD8066]/10 text-[#AD8066] font-semibold"
            : "text-[#242424] hover:bg-[#F5F5F5] hover:text-[#AD8066]"
        )}
      >
        <div className={cn("flex items-center min-w-0", isCollapsed ? "justify-center" : "gap-2.5")}>
          <IconComponent
            className={cn(
              "shrink-0 transition-colors",
              isCollapsed ? "size-5" : "size-4",
              isExactActive
                ? "text-white"
                : isActive
                ? "text-[#AD8066]"
                : "text-[#6B6B6B] group-hover:text-[#AD8066]"
            )}
          />
          {!isCollapsed && <span className="truncate">{itemLabel}</span>}
        </div>

        {!isCollapsed && item.badge && (
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0",
              isExactActive
                ? "bg-white/20 text-white"
                : "bg-[#AD8066]/15 text-[#AD8066]"
            )}
          >
            {item.badge}
          </span>
        )}

        {isCollapsed && item.badge && (
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-[#AD8066]" />
        )}
      </Link>
    )
  }

  return (
    <div className={cn("flex flex-col h-full bg-white select-none", className)}>
      {/* Optional Top Branding Header */}
      {showHeader && (
        <div className={cn("border-b border-[#E5E5E5] flex items-center shrink-0", isCollapsed ? "p-2.5 justify-center" : "p-4 justify-between gap-2.5")}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#AD8066] text-white shadow-xs shrink-0">
              <Sparkles className="size-5" />
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="text-base font-bold text-[#242424] tracking-tight">ServiceHub</h2>
                <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider">Navigation</p>
              </div>
            )}
          </div>
          {onToggleCollapse && !isCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#242424] hover:bg-[#F5F5F5] transition-colors cursor-pointer"
              title="Collapse menu"
              aria-label="Collapse menu"
            >
              <ChevronLeft className="size-4" />
            </button>
          )}
        </div>
      )}

      {/* Main Menu Links Area - Independent Scroll for menu items */}
      <div className={cn("flex-1 space-y-1.5 overflow-y-auto overscroll-contain transition-all", isCollapsed ? "p-2" : "p-3 sm:p-4")}>
        <div className={cn("flex items-center pb-2", isCollapsed ? "justify-center px-1" : "justify-between px-2.5")}>
          {!isCollapsed ? (
            <>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B]">
                Menu
              </span>
              {onToggleCollapse && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="p-1 rounded-lg text-[#6B6B6B] hover:text-[#242424] hover:bg-[#F5F5F5] transition-colors cursor-pointer"
                  title="Collapse side menu"
                  aria-label="Collapse side menu"
                >
                  <ChevronLeft className="size-3.5" />
                </button>
              )}
            </>
          ) : (
            onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#242424] hover:bg-[#F5F5F5] transition-colors cursor-pointer"
                title="Expand side menu"
                aria-label="Expand side menu"
              >
                <ChevronRight className="size-4" />
              </button>
            )
          )}
        </div>

        {isNavLoading && menuItems.length === 0 ? (
          <div className="space-y-2 py-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton
                key={i}
                className={cn("rounded-xl bg-[#F5F5F5]", isCollapsed ? "size-10 mx-auto" : "h-9 w-full")}
              />
            ))}
          </div>
        ) : menuItems.length === 0 ? (
          <div className={cn("text-center py-6 text-xs text-[#6B6B6B]", isCollapsed ? "px-1 text-[10px]" : "px-3")}>
            <p>No items</p>
          </div>
        ) : (
          menuItems.map((item) => renderMenuItem(item))
        )}
      </div>

      {/* User Info & Quick Sign Out Footer - Pinned at bottom */}
      {showUserFooter && authUser && (
        <div className={cn("border-t border-[#E5E5E5] bg-[#FAFAFA]/80 shrink-0 transition-all", isCollapsed ? "p-2" : "p-3")}>
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2 py-1">
              <div
                className="size-9 rounded-full bg-[#AD8066]/15 text-[#AD8066] border border-[#AD8066]/30 font-semibold text-xs flex items-center justify-center shrink-0 cursor-default"
                title={`${authUser.firstName} ${authUser.lastName} (${authUser.role || currentRole})`}
              >
                {authUser.firstName ? authUser.firstName.charAt(0).toUpperCase() : "U"}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={handleLogout}
                isLoading={isLoggingOut}
                className="size-8 text-[#6B6B6B] hover:text-[#C74747] hover:bg-[#C74747]/10 shrink-0"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-[#E5E5E5] shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-8 rounded-full bg-[#AD8066]/15 text-[#AD8066] border border-[#AD8066]/30 font-semibold text-xs flex items-center justify-center shrink-0">
                  {authUser.firstName ? authUser.firstName.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#242424] truncate">
                    {authUser.firstName} {authUser.lastName}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-[#6B6B6B] truncate">
                    <Shield className="size-2.5 text-[#AD8066]" />
                    <span>{authUser.role || currentRole}</span>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={handleLogout}
                isLoading={isLoggingOut}
                className="text-[#6B6B6B] hover:text-[#C74747] hover:bg-[#C74747]/10 shrink-0"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
