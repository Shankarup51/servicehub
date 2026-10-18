"use client"

import * as React from "react"
import { ProtectedRoute } from "@/features/auth/protected-route"
import { AdminDashboardView } from "@/features/dashboard/admin-dashboard-view"

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <AdminDashboardView />
    </ProtectedRoute>
  )
}
