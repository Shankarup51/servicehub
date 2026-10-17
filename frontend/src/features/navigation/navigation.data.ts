import * as React from "react"
import {
  LayoutDashboard,
  Briefcase,
  Calendar,
  Users,
  Settings,
  Layers,
  Star,
  CreditCard,
  BarChart3,
  ShoppingBag,
  Compass,
  HelpCircle,
  FileText,
  UserCheck,
} from "lucide-react"
import { NavigationSection } from "./navigation.types"

export const navigationIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  services: Briefcase,
  calendar: Calendar,
  users: Users,
  settings: Settings,
  categories: Layers,
  reviews: Star,
  payments: CreditCard,
  analytics: BarChart3,
  bookings: ShoppingBag,
  explore: Compass,
  help: HelpCircle,
  documents: FileText,
  providers: UserCheck,
}

export const customerNavigation: NavigationSection[] = [
  {
    id: "main",
    items: [
      { id: "explore", title: "Explore Services", href: "/services", icon: "explore" },
      { id: "categories", title: "Categories", href: "/categories", icon: "categories" },
      { id: "bookings", title: "My Bookings", href: "/bookings", icon: "bookings", badge: "2" },
      { id: "reviews", title: "My Reviews", href: "/reviews", icon: "reviews" },
    ],
  },
  {
    id: "account",
    title: "Account",
    items: [
      { id: "settings", title: "Settings", href: "/settings", icon: "settings" },
      { id: "help", title: "Help & Support", href: "/help", icon: "help" },
    ],
  },
]

export const providerNavigation: NavigationSection[] = [
  {
    id: "overview",
    items: [
      { id: "dashboard", title: "Dashboard", href: "/provider/dashboard", icon: "dashboard" },
      { id: "my-services", title: "My Services", href: "/provider/services", icon: "services" },
      { id: "schedule", title: "Schedule & Calendar", href: "/provider/schedule", icon: "calendar" },
      { id: "bookings", title: "Customer Bookings", href: "/provider/bookings", icon: "bookings", badge: "5", badgeVariant: "warning" },
      { id: "earnings", title: "Earnings & Payouts", href: "/provider/earnings", icon: "payments" },
      { id: "reviews", title: "Client Reviews", href: "/provider/reviews", icon: "reviews" },
    ],
  },
  {
    id: "account",
    title: "Settings",
    items: [
      { id: "settings", title: "Profile Settings", href: "/provider/settings", icon: "settings" },
    ],
  },
]

export const adminNavigation: NavigationSection[] = [
  {
    id: "admin-main",
    title: "Administration",
    items: [
      { id: "admin-dashboard", title: "Overview", href: "/admin", icon: "dashboard" },
      { id: "admin-users", title: "Users & Accounts", href: "/admin/users", icon: "users" },
      { id: "admin-providers", title: "Service Providers", href: "/admin/providers", icon: "providers" },
      { id: "admin-services", title: "Services Catalog", href: "/admin/services", icon: "services" },
      { id: "admin-categories", title: "Categories", href: "/admin/categories", icon: "categories" },
      { id: "admin-bookings", title: "Bookings", href: "/admin/bookings", icon: "bookings" },
      { id: "admin-analytics", title: "Reports & Analytics", href: "/admin/analytics", icon: "analytics" },
    ],
  },
  {
    id: "system",
    title: "System",
    items: [
      { id: "admin-settings", title: "System Settings", href: "/admin/settings", icon: "settings" },
    ],
  },
]
