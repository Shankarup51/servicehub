"use client";

import * as React from "react";
import { ProtectedRoute } from "@/features/auth/protected-route";

export default function ProtectedRouteGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <React.Suspense fallback={null}>
      <ProtectedRoute>{children}</ProtectedRoute>
    </React.Suspense>
  );
}
