"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { useGetMeQuery } from "./auth.api";
import { setCredentials } from "./auth.slice";
import { Spinner } from "@/components/feedback/spinner";

export interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  fallback,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  const { user, accessToken, isAuthenticated, isInitialized } = useAppSelector(
    (state) => state.auth
  );

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Sync user profile if token is present but user profile is missing
  const { data: fetchedUser, isSuccess: isUserSuccess } = useGetMeQuery(undefined, {
    skip: !accessToken || !!user,
  });

  React.useEffect(() => {
    if (isUserSuccess && fetchedUser && accessToken) {
      dispatch(
        setCredentials({
          user: fetchedUser,
          accessToken,
        })
      );
    }
  }, [isUserSuccess, fetchedUser, accessToken, dispatch]);

  React.useEffect(() => {
    if (!mounted || !isInitialized) return;

    // If unauthenticated or no access token: user is not logged in.
    // Never call refresh API. Immediately redirect to login page.
    if (!isAuthenticated || !accessToken) {
      const redirectUrl = encodeURIComponent(pathname || "/dashboard");
      router.replace(`/auth/login?redirect=${redirectUrl}`);
      return;
    }

    // Role-based access control
    if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
      router.replace("/unauthorized");
    }
  }, [mounted, isInitialized, isAuthenticated, accessToken, user, allowedRoles, router, pathname]);

  // While mounting, initializing, or unauthenticated, block content
  if (!mounted || !isInitialized || !isAuthenticated || !accessToken) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Spinner size="lg" centered label="Verifying authorization..." />
        </div>
      )
    );
  }

  // If role is forbidden:
  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
        <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have the required permissions to view this area.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
