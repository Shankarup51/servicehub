"use client"

import * as React from "react"
import { useAppSelector } from "@/lib/hooks"
import { CustomerDashboardView } from "@/features/dashboard/customer-dashboard-view"
import { ProviderDashboardView } from "@/features/dashboard/provider-dashboard-view"
import { AdminDashboardView } from "@/features/dashboard/admin-dashboard-view"

import { useRouter } from "next/navigation"

type SupportedRole = "CUSTOMER" | "SERVICE_PROVIDER" | "ADMIN"

export default function DashboardRouterPage() {
  const router = useRouter()
  const user = useAppSelector((state) => state.auth.user)

  // Derive the active role cleanly based on the authenticated user's assigned roles
  const activeRole: SupportedRole | null = React.useMemo(() => {
    if (user?.roles?.includes("ADMIN") || user?.role === "ADMIN") {
      return "ADMIN"
    }
    if (user?.roles?.includes("SERVICE_PROVIDER") || user?.role === "SERVICE_PROVIDER") {
      return "SERVICE_PROVIDER"
    }
    if (user?.roles?.includes("CUSTOMER") || user?.role === "CUSTOMER") {
      return "CUSTOMER"
    }
    return null
  }, [user])

  React.useEffect(() => {
    if (user && !activeRole) {
      router.replace("/unauthorized")
    }
  }, [user, activeRole, router])

  if (activeRole === "ADMIN") {
    return <AdminDashboardView />
  }

  if (activeRole === "SERVICE_PROVIDER") {
    return <ProviderDashboardView />
  }

  if (activeRole === "CUSTOMER") {
    return <CustomerDashboardView />
  }

  return null
}
