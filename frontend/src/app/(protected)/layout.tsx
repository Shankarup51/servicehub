"use client";

import * as React from "react";
import { ProtectedRoute } from "@/features/auth/protected-route";

export default function ProtectedRouteGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
