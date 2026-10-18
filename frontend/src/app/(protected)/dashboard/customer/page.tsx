"use client"

import * as React from "react"
import { ProtectedRoute } from "@/features/auth/protected-route"
import { CustomerDashboardView } from "@/features/dashboard/customer-dashboard-view"

export default function CustomerDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["CUSTOMER", "ADMIN"]}>
      <CustomerDashboardView />
    </ProtectedRoute>
  )
}
