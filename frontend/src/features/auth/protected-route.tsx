"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { useGetMeQuery } from "./auth.api";
import { setCredentials } from "./auth.slice";
import { Spinner } from "@/components/feedback/spinner";
import { ShieldAlert } from "lucide-react";

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

  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

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

    // Role-based access control & No-role check:
    if (user) {
      const userRoles: string[] =
        Array.isArray(user.roles) && user.roles.length > 0
          ? user.roles
          : user.role
          ? [user.role]
          : [];

      // If user has NO assigned role, block access immediately
      if (userRoles.length === 0) {
        router.replace("/unauthorized");
        return;
      }

      // If specific roles are required, verify match
      if (allowedRoles) {
        const hasAllowedRole = userRoles.some((r) => allowedRoles.includes(r));
        if (!hasAllowedRole) {
          router.replace("/unauthorized");
          return;
        }
      }
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

  // If user has no roles assigned:
  if (user) {
    const userRoles: string[] =
      Array.isArray(user.roles) && user.roles.length > 0
        ? user.roles
        : user.role
        ? [user.role]
        : [];

    if (userRoles.length === 0) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
          <div className="size-16 rounded-2xl bg-[#C74747]/10 text-[#C74747] flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="size-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground">No Role Assigned</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">
            Your account currently has no assigned role and cannot access this platform. Please go to the login page and sign in with other credentials.
          </p>
        </div>
      );
    }

    // If specific role is forbidden:
    if (allowedRoles) {
      const hasAllowedRole = userRoles.some((r) => allowedRoles.includes(r));
      if (!hasAllowedRole) {
        return (
          <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
            <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You do not have the required permissions to view this area.
            </p>
          </div>
        );
      }
    }
  }

  return <>{children}</>;
}
