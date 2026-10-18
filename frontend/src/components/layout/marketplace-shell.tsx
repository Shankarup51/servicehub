"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Sparkles,
  Search,
  ChevronDown,
  LogOut,
  SlidersHorizontal,
  X,
  User,
  Shield,
  Settings,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"

import { useAppSelector } from "@/lib/hooks"
import { useLogoutMutation } from "@/features/auth/auth.api"
import { Breadcrumbs, BreadcrumbItem } from "@/components/layout/breadcrumbs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { ResponsiveDrawer } from "@/components/overlays/responsive-drawer"
import { SideMenu } from "@/components/layout/side-menu"
import { showSuccessToast } from "@/shared/ui/toast-service"
import { cn } from "@/lib/utils"

export interface ActiveFilter {
  id: string
  label: string
  onRemove: () => void
}

export interface MarketplaceShellProps {
  currentRole?: "CUSTOMER" | "SERVICE_PROVIDER" | "ADMIN"
  breadcrumbs?: BreadcrumbItem[]
  showBreadcrumbHome?: boolean
  heading?: string
  subheading?: string
  searchQuery?: string
  onSearchChange?: (val: string) => void
  searchPlaceholder?: string
  sortOption?: string
  onSortChange?: (val: string) => void
  sortOptions?: { label: string; value: string }[]
  activeFilters?: ActiveFilter[]
  onClearAllFilters?: () => void
  leftPanel?: React.ReactNode
  children: React.ReactNode
}

export function MarketplaceShell({
  currentRole = "CUSTOMER",
  breadcrumbs = [{ label: "Dashboard" }],
  showBreadcrumbHome = false,
  heading,
  subheading,
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search services, tasks, or providers...",
  sortOption = "highest-ratings",
  onSortChange,
  sortOptions = [
    { label: "Highest Ratings", value: "highest-ratings" },
    { label: "Most Booked", value: "most-booked" },
    { label: "Newest Providers", value: "newest-providers" },
    { label: "Price: Low to High", value: "price-asc" },
    { label: "Price: High to Low", value: "price-desc" },
  ],
  activeFilters = [],
  onClearAllFilters,
  leftPanel,
  children,
}: MarketplaceShellProps) {
  const router = useRouter()
  const authUser = useAppSelector((state) => state.auth.user)
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation()
  const [sideMenuDrawerOpen, setSideMenuDrawerOpen] = React.useState(false)
  const [filterOverlayOpen, setFilterOverlayOpen] = React.useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false)
  // Collapsed state synced with localStorage and cross-tab/storage events
  const isCollapsed = React.useSyncExternalStore(
    React.useCallback((callback: () => void) => {
      if (typeof window === "undefined") return () => {}
      window.addEventListener("storage", callback)
      window.addEventListener("servicehub_sidemenu_change", callback)
      return () => {
        window.removeEventListener("storage", callback)
        window.removeEventListener("servicehub_sidemenu_change", callback)
      }
    }, []),
    () => {
      if (typeof window === "undefined") return false
      try {
        return localStorage.getItem("servicehub_sidemenu_collapsed") === "true"
      } catch {
        return false
      }
    },
    () => false
  )

  const handleToggleCollapse = React.useCallback(() => {
    try {
      const current = localStorage.getItem("servicehub_sidemenu_collapsed") === "true"
      localStorage.setItem("servicehub_sidemenu_collapsed", String(!current))
      window.dispatchEvent(new Event("servicehub_sidemenu_change"))
    } catch {}
  }, [])

  const handleLogout = async () => {
    try {
      await logout().unwrap()
      showSuccessToast("Signed Out", {
        description: "You have been safely signed out.",
      })
      router.replace("/")
    } catch {
      router.replace("/")
    }
  }

  return (
    <div className="h-screen bg-white flex flex-col text-[#242424] w-full overflow-hidden">
      {/* Top Header Bar - Fixed at top */}
      <header className="w-full border-b border-[#E5E5E5] bg-white px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between shrink-0 z-30">
          {/* Logo & Mobile / Desktop Menu Toggle */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setSideMenuDrawerOpen(true)}
              className="lg:hidden text-[#242424] hover:bg-[#F5F5F5] rounded-xl cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="size-5" />
            </Button>

            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex size-9 items-center justify-center rounded-xl bg-[#AD8066] text-white shadow-xs group-hover:bg-[#94684F] transition-colors shrink-0">
                <Sparkles className="size-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-[#242424]">
                ServiceHub
              </span>
            </Link>

            {/* Desktop Side Menu Collapse / Expand Toggle Button in Header */}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleToggleCollapse}
              className="hidden lg:flex text-[#6B6B6B] hover:text-[#242424] hover:bg-[#F5F5F5] rounded-xl cursor-pointer ml-1"
              title={isCollapsed ? "Expand side menu" : "Collapse side menu"}
              aria-label={isCollapsed ? "Expand side menu" : "Collapse side menu"}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="size-4.5 text-[#6B6B6B]" />
              ) : (
                <PanelLeftClose className="size-4.5 text-[#6B6B6B]" />
              )}
            </Button>
          </div>

          {/* Right Controls: Profile Avatar Menu */}
          <div className="flex items-center gap-3">

            {/* Profile Avatar / User Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1 rounded-full hover:bg-[#F5F5F5] transition-colors focus:outline-none focus:ring-2 focus:ring-[#AD8066]/30 cursor-pointer"
                aria-expanded={userDropdownOpen}
                aria-haspopup="true"
              >
                <div className="size-9 rounded-full bg-[#AD8066]/15 text-[#AD8066] border border-[#AD8066]/30 font-semibold text-xs flex items-center justify-center">
                  {authUser?.firstName ? authUser.firstName.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-semibold text-[#242424] leading-tight">
                    {authUser?.firstName || "Customer"} {authUser?.lastName || ""}
                  </span>
                  <span className="text-[10px] text-[#6B6B6B] uppercase tracking-wider">
                    {authUser?.role || currentRole}
                  </span>
                </div>
                <ChevronDown className="size-3.5 text-[#6B6B6B] hidden md:block" />
              </button>

              {/* User Dropdown Popover */}
              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-[#E5E5E5] shadow-lg p-2 z-40 space-y-1 text-sm">
                    <div className="px-3 py-2 border-b border-[#E5E5E5]">
                      <p className="font-semibold text-[#242424] truncate">
                        {authUser?.firstName} {authUser?.lastName}
                      </p>
                      <p className="text-xs text-[#6B6B6B] truncate">{authUser?.email}</p>
                      <div className="mt-1.5 inline-flex items-center gap-1 rounded bg-[#F5F5F5] px-2 py-0.5 text-[10px] font-medium text-[#AD8066]">
                        <Shield className="size-3" />
                        <span>{authUser?.role || currentRole}</span>
                      </div>
                    </div>

                    <Link
                      href="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#242424] hover:bg-[#F5F5F5] transition-colors text-xs font-medium"
                    >
                      <User className="size-3.5 text-[#6B6B6B]" />
                      <span>My Dashboard</span>
                    </Link>

                    <Link
                      href="/settings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#242424] hover:bg-[#F5F5F5] transition-colors text-xs font-medium"
                    >
                      <Settings className="size-3.5 text-[#6B6B6B]" />
                      <span>Account Settings</span>
                    </Link>

                    <div className="border-t border-[#E5E5E5] pt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                        isLoading={isLoggingOut}
                        className="w-full justify-start text-[#C74747] hover:bg-[#C74747]/10 hover:text-[#C74747] text-xs font-medium"
                        leftIcon={<LogOut className="size-3.5" />}
                      >
                        Log Out
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

      {/* Main Split Layout: Left Fixed Side Menu + Right Scrollable Page */}
      <div className="flex-1 flex overflow-hidden w-full">
        {/* Left Desktop Side Menu - Fixed & Self-Scrolling */}
        <aside
          className={cn(
            "hidden lg:flex flex-col shrink-0 border-r border-[#E5E5E5] bg-white h-full overflow-hidden transition-all duration-300 ease-in-out",
            isCollapsed ? "w-16" : "w-64"
          )}
        >
          <SideMenu
            currentRole={currentRole}
            isCollapsed={isCollapsed}
            onToggleCollapse={handleToggleCollapse}
          />
        </aside>

        {/* Right Main Content Area - Only this page area scrolls */}
        <main className="flex-1 h-full overflow-y-auto min-w-0 flex flex-col bg-white">
          {/* Breadcrumb Strip - Inside main page, above content, NOT over side menu */}
          <div className="w-full bg-[#FAFAFA] border-b border-[#E5E5E5] px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between text-xs text-[#6B6B6B] shrink-0">
            <Breadcrumbs items={breadcrumbs} showHome={showBreadcrumbHome} />
            <span className="hidden md:inline text-[11px] text-[#6B6B6B]/80">
              Verified Home Services Marketplace
            </span>
          </div>

          {/* Main Content Body */}
          <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Search, Sort and Filters Bar */}
            {(onSearchChange || onSortChange || leftPanel) && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {/* Search Input & Filter Button Group */}
                  <div className="flex items-center gap-2.5 flex-1 max-w-lg">
                    {onSearchChange && (
                      <div className="flex-1">
                        <Input
                          value={searchQuery || ""}
                          onChange={(e) => onSearchChange(e.target.value)}
                          placeholder={searchPlaceholder}
                          leftIcon={<Search className="size-4 text-[#6B6B6B]" />}
                          clearable
                          onClear={() => onSearchChange("")}
                          className="h-10 bg-white border-[#E5E5E5] text-xs sm:text-sm rounded-lg focus:ring-[#AD8066]/30 focus:border-[#AD8066]"
                        />
                      </div>
                    )}

                    {/* Filter Icon Button right beside search input */}
                    {leftPanel && (
                      <Button
                        type="button"
                        onClick={() => setFilterOverlayOpen(true)}
                        className={cn(
                          "h-10 px-3.5 rounded-lg border text-xs font-medium transition-all shadow-xs shrink-0 cursor-pointer",
                          activeFilters.length > 0
                            ? "bg-[#AD8066] text-white border-[#AD8066] hover:bg-[#94684F]"
                            : "bg-white text-[#242424] border-[#E5E5E5] hover:bg-[#F5F5F5] hover:border-[#D4D4D4]"
                        )}
                        title="Open Filters"
                        aria-label="Open Filters"
                        leftIcon={<SlidersHorizontal className="size-4" />}
                      >
                        <span className="hidden sm:inline">Filters</span>
                        {activeFilters.length > 0 && (
                          <span
                            className={cn(
                              "size-5 rounded-full text-[10px] font-bold flex items-center justify-center",
                              activeFilters.length > 0
                                ? "bg-white text-[#AD8066]"
                                : "bg-[#AD8066] text-white"
                            )}
                          >
                            {activeFilters.length}
                          </span>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Sort by Dropdown */}
                  {onSortChange && (
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <span className="text-xs font-medium text-[#6B6B6B]">Sort by:</span>
                      <div className="w-44">
                        <Select
                          value={sortOption}
                          onValueChange={onSortChange}
                          options={sortOptions}
                          triggerClassName="h-10 bg-white border-[#E5E5E5] text-xs font-medium rounded-lg text-[#242424]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Active Filter Chips */}
                {activeFilters.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    <span className="text-[#6B6B6B] font-medium mr-1">Active Filters:</span>
                    {activeFilters.map((filter) => (
                      <span
                        key={filter.id}
                        className="inline-flex items-center gap-1.5 rounded-md bg-[#F5F5F5] border border-[#E5E5E5] px-2.5 py-1 text-xs font-medium text-[#242424]"
                      >
                        <span>{filter.label}</span>
                        <button
                          type="button"
                          onClick={filter.onRemove}
                          className="text-[#6B6B6B] hover:text-[#C74747] focus:outline-none"
                          aria-label={`Remove filter ${filter.label}`}
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}

                    {onClearAllFilters && activeFilters.length > 0 && (
                      <button
                        type="button"
                        onClick={onClearAllFilters}
                        className="text-xs font-medium text-[#AD8066] hover:text-[#94684F] ml-1 transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Section Heading & Subheading */}
            {heading && (
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#242424]">
                  {heading}
                </h1>
                {subheading && (
                  <p className="text-xs sm:text-sm text-[#6B6B6B] leading-relaxed">
                    {subheading}
                  </p>
                )}
              </div>
            )}

            {/* Main Content Children */}
            {children}
          </div>

          {/* Footer Attribution */}
          <footer className="w-full border-t border-[#E5E5E5] bg-[#FAFAFA] text-center text-xs text-[#6B6B6B] py-4 mt-auto shrink-0">
            <p>© 2026 ServiceHub • Verified Pro Marketplace • Protected by Secure Auth & RBAC</p>
          </footer>
        </main>
      </div>

      {/* Mobile/Tablet Side Menu Drawer */}
      <ResponsiveDrawer
        open={sideMenuDrawerOpen}
        onOpenChange={setSideMenuDrawerOpen}
        title="Navigation Menu"
        side="left"
        className="max-w-xs w-full p-0 bg-white"
      >
        <SideMenu
          currentRole={currentRole}
          onNavigate={() => setSideMenuDrawerOpen(false)}
          showHeader={false}
        />
      </ResponsiveDrawer>

      {/* Filter Overlay Drawer */}
      {leftPanel && (
        <ResponsiveDrawer
          open={filterOverlayOpen}
          onOpenChange={setFilterOverlayOpen}
          title="Filters"
          description="Refine marketplace results by category, price, and status."
          side="right"
          className="max-w-md w-full bg-white"
          footer={
            <div className="flex items-center justify-between w-full">
              {onClearAllFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onClearAllFilters()
                  }}
                  className="text-xs text-[#6B6B6B] hover:text-[#242424]"
                >
                  Clear all
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                onClick={() => setFilterOverlayOpen(false)}
                className="bg-[#AD8066] hover:bg-[#94684F] text-white text-xs px-4"
              >
                Apply Filters
              </Button>
            </div>
          }
        >
          <div className="p-2 space-y-4">{leftPanel}</div>
        </ResponsiveDrawer>
      )}
    </div>
  )
}
