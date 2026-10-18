"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Mail, Lock, ArrowRight, AlertCircle, Sparkles, User, Shield, Briefcase } from "lucide-react"

import { Button } from "@/components/ui/button"
import { WebText } from "@/components/ui/web-text"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { FormField } from "@/components/forms/form-field"
import { Card } from "@/components/data-display/base-card"
import { useLoginMutation } from "@/features/auth/auth.api"


const REMEMBER_EMAIL_KEY = "servicehub_remember_email"
const REMEMBER_DEVICE_KEY = "servicehub_remember_device"

/**
 * Resolves the primary dashboard route based on user's assigned roles.
 *
 * Precedence rule for multi-role accounts:
 * 1. ADMIN (Highest administrative and operational authority) -> /admin
 * 2. SERVICE_PROVIDER (Provider services & booking fulfillment workflows) -> /dashboard/provider
 * 3. CUSTOMER (Marketplace consumer & service discovery workflows) -> /dashboard/customer
 *
 * If the user has no recognized roles or is missing roles:
 * Returns null to prevent unauthorized privilege escalation.
 */
export function getRoleDashboardRoute(
  roles?: string[] | null,
  singleRole?: string | null
): string | null {
  const normalizedRoles = new Set<string>()

  if (Array.isArray(roles)) {
    roles.forEach((r) => {
      if (typeof r === "string" && r.trim()) {
        normalizedRoles.add(r.trim().toUpperCase())
      }
    })
  }

  if (typeof singleRole === "string" && singleRole.trim()) {
    normalizedRoles.add(singleRole.trim().toUpperCase())
  }

  if (normalizedRoles.has("ADMIN")) {
    return "/admin"
  }

  if (normalizedRoles.has("SERVICE_PROVIDER")) {
    return "/dashboard/provider"
  }

  if (normalizedRoles.has("CUSTOMER")) {
    return "/dashboard/customer"
  }

  return null
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get("redirect") || "/dashboard"

  const [login, { isLoading }] = useLoginMutation()

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [rememberMe, setRememberMe] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  // Restore remembered email and preference on initial mount
  React.useEffect(() => {
    try {
      const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY)
      const savedPreference = localStorage.getItem(REMEMBER_DEVICE_KEY)

      if (savedEmail) {
        setTimeout(() => {
          setEmail(savedEmail)
          setRememberMe(true)
        }, 0)
      } else if (savedPreference !== null) {
        setTimeout(() => {
          setRememberMe(savedPreference === "true")
        }, 0)
      }
    } catch {
      // Storage access error ignored
    }
  }, [])

  const handleRememberMeChange = (checked: boolean) => {
    setRememberMe(checked)
    try {
      localStorage.setItem(REMEMBER_DEVICE_KEY, checked ? "true" : "false")
      if (!checked) {
        localStorage.removeItem(REMEMBER_EMAIL_KEY)
      } else if (email.trim()) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim().toLowerCase())
      }
    } catch {
      // Storage access error ignored
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) {
      setErrorMessage("Please enter your email address.")
      return
    }
    if (!password) {
      setErrorMessage("Please enter your password.")
      return
    }

    try {
      const loginResult = await login({
        email: cleanEmail,
        password,
        rememberMe,
      }).unwrap()

      // Persist or remove remembered email based on user's choice
      try {
        if (rememberMe) {
          localStorage.setItem(REMEMBER_EMAIL_KEY, cleanEmail)
          localStorage.setItem(REMEMBER_DEVICE_KEY, "true")
        } else {
          localStorage.removeItem(REMEMBER_EMAIL_KEY)
          localStorage.setItem(REMEMBER_DEVICE_KEY, "false")
        }
      } catch {
        // Storage access error ignored
      }

      // Clear password and any errors; retain email if rememberMe is enabled
      setPassword("")
      if (!rememberMe) {
        setEmail("")
      }
      setErrorMessage(null)

      // Resolve role-based destination with explicit precedence
      const roleRoute = getRoleDashboardRoute(
        loginResult.user.roles,
        loginResult.user.role
      )

      // If user has NO role, they cannot access anything on ServiceHub
      if (!roleRoute) {
        router.replace("/unauthorized")
        return
      }

      // If a specific deep link was requested (e.g. /services, /bookings), honor it;
      // otherwise, navigate to the assigned role dashboard.
      const isGenericRedirect =
        !redirectPath ||
        redirectPath === "/" ||
        redirectPath === "/dashboard" ||
        redirectPath.startsWith("/auth")

      if (!isGenericRedirect) {
        router.replace(redirectPath)
      } else {
        router.replace(roleRoute)
      }
    } catch (err: unknown) {
      const error = err as { data?: { message?: string | string[] } }
      const msg =
        Array.isArray(error.data?.message)
          ? error.data?.message.join(", ")
          : error.data?.message || "Invalid email or password. Please try again."

      setErrorMessage(msg)
    }
  }

  const fillDemoCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail)
    setPassword(demoPass)
    setErrorMessage(null)
  }

  return (
    <div className="w-full animate-in fade-in-50 slide-in-from-bottom-3 duration-300">
      <Card className="p-6 sm:p-8 bg-card border-border shadow-xl rounded-3xl relative overflow-hidden">
        {/* Top subtle primary accent line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-primary/20 via-primary to-primary/20" />

        {/* Card Header using WebText */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between">
            <WebText variant="h2" className="text-foreground font-bold">
              Sign In
            </WebText>
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </span>
          </div>
          <WebText variant="muted">
            Access your bookings, track scheduled pros, and manage your account.
          </WebText>
        </div>

        {/* Quick Demo Autofill Pills */}
        <div className="mb-6 p-3.5 rounded-2xl bg-secondary/50 border border-border/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Quick Demo Fill:
            </span>
            <span className="text-[11px] text-primary font-medium">Click to test</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fillDemoCredentials("customer@servicehub.com", "Password123!")}
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-card border border-border hover:border-primary/50 text-foreground transition-all duration-150 hover:shadow-xs active:scale-98 cursor-pointer"
            >
              <User className="size-3.5 text-primary" />
              <span>Customer Account</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemoCredentials("provider@servicehub.com", "Password123!")}
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-card border border-border hover:border-primary/50 text-foreground transition-all duration-150 hover:shadow-xs active:scale-98 cursor-pointer"
            >
              <Briefcase className="size-3.5 text-primary" />
              <span>Provider Account</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemoCredentials("admin@servicehub.com", "Password123!")}
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-card border border-border hover:border-primary/50 text-foreground transition-all duration-150 hover:shadow-xs active:scale-98 cursor-pointer"
            >
              <Shield className="size-3.5 text-primary" />
              <span>Admin Account</span>
            </button>
          </div>
        </div>

        {/* Inline Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive-foreground text-xs animate-in fade-in duration-200"
          >
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Email Address" required>
            <Input
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="size-4" />}
              disabled={isLoading}
              required
            />
          </FormField>

          <FormField label="Password" required>
            <Input
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="size-4" />}
              disabled={isLoading}
              required
            />
          </FormField>

          {/* Remember me & Forgot Password */}
          <div className="flex items-center justify-between pt-1">
            <Checkbox
              id="remember-me"
              checked={rememberMe}
              onCheckedChange={(checked) => handleRememberMeChange(Boolean(checked))}
              label="Remember this device"
              disabled={isLoading}
            />

            <Link
              href="/auth/forgot-password"
              className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              rightIcon={<ArrowRight className="size-4.5" />}
            >
              Sign In to ServiceHub
            </Button>
          </div>
        </form>

        {/* Sign Up Link Footer */}
        <div className="mt-6 pt-5 border-t border-border/80 text-center text-xs text-muted-foreground">
          Don&apos;t have an account yet?{" "}
          <Link
            href={`/auth/register${redirectPath !== "/dashboard" ? `?redirect=${encodeURIComponent(redirectPath)}` : ""}`}
            className="font-semibold text-primary hover:text-primary/80 transition-colors ml-1 underline underline-offset-4"
          >
            Create free account
          </Link>
        </div>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="w-full p-8 text-center text-xs text-muted-foreground">
          Loading sign in portal...
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  )
}
