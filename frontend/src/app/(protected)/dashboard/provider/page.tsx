"use client"

import * as React from "react"
import { ProtectedRoute } from "@/features/auth/protected-route"
import { ProviderDashboardView } from "@/features/dashboard/provider-dashboard-view"

export default function ProviderDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["SERVICE_PROVIDER", "ADMIN"]}>
      <ProviderDashboardView />
    </ProtectedRoute>
  )
}
