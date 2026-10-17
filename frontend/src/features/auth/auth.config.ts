/**
 * ServiceHub Route Protection Configuration
 */

export const PROTECTED_ROUTES = [
  "/dashboard",
  "/bookings",
  "/provider",
  "/admin",
  "/settings",
  "/profile",
  "/checkout",
] as const;

export const AUTH_ROUTES = [
  "/auth/login",
  "/auth/register",
  "/auth/verify-email",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/login",
  "/register",
] as const;

/**
 * Determines if a given pathname requires authentication.
 * Matches exact paths or sub-routes (e.g., /dashboard, /dashboard/stats, /bookings/123).
 */
export function isProtectedRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;

  const normalized = pathname.toLowerCase().trim();

  return PROTECTED_ROUTES.some(
    (route) => normalized === route || normalized.startsWith(`${route}/`)
  );
}

/**
 * Determines if a given pathname is an authentication page (login, register).
 */
export function isAuthRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;

  const normalized = pathname.toLowerCase().trim();

  return AUTH_ROUTES.some(
    (route) => normalized === route || normalized.startsWith(`${route}/`)
  );
}
