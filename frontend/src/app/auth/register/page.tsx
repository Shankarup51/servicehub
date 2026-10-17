"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { WebText } from "@/components/ui/web-text"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { FormField } from "@/components/forms/form-field"
import { Card } from "@/components/data-display/base-card"
import { useRegisterMutation } from "@/features/auth/auth.api"
import { showSuccessToast, showErrorToast } from "@/shared/ui/toast-service"

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get("redirect") || "/dashboard"

  const [registerUser, { isLoading }] = useRegisterMutation()

  // Form State
  const [firstName, setFirstName] = React.useState("")
  const [lastName, setLastName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [agreeTerms, setAgreeTerms] = React.useState(false)

  // Validation & Error state
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [successCreated, setSuccessCreated] = React.useState(false)
  const [registeredEmail, setRegisteredEmail] = React.useState("")

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    let score = 0
    if (pass.length >= 8) score += 1
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1
    if (/[0-9]/.test(pass)) score += 1
    if (/[^A-Za-z0-9]/.test(pass)) score += 1
    return score
  }

  const strengthScore = getPasswordStrength(password)
  const strengthLabels = ["Too Weak", "Fair", "Good", "Strong"]
  const strengthColors = [
    "bg-destructive text-destructive-foreground",
    "bg-amber-500 text-white",
    "bg-amber-600 text-white",
    "bg-success text-success-foreground",
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!firstName.trim()) {
      setErrorMessage("Please enter your first name.")
      return
    }
    if (!email.trim()) {
      setErrorMessage("Please enter a valid email address.")
      return
    }
    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.")
      return
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify.")
      return
    }
    if (!agreeTerms) {
      setErrorMessage("You must accept the Terms of Service to continue.")
      return
    }

    const emailToSubmit = email.trim().toLowerCase()

    try {
      await registerUser({
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        email: emailToSubmit,
        phone: phone.trim() ? phone.replace(/[^0-9]/g, "") : "9876543210",
        password,
      }).unwrap()

      setRegisteredEmail(emailToSubmit)
      setSuccessCreated(true)

      // Clear all form inputs upon successful submission
      setFirstName("")
      setLastName("")
      setEmail("")
      setPhone("")
      setPassword("")
      setConfirmPassword("")
      setAgreeTerms(false)
      setErrorMessage(null)

      showSuccessToast("Account Created Successfully!", {
        description: "Please check your email to verify your account.",
      })
    } catch (err: unknown) {
      const error = err as { data?: { message?: string | string[] } }
      const msg =
        Array.isArray(error.data?.message)
          ? error.data?.message.join(", ")
          : error.data?.message || "Registration failed. Please check your information."

      setErrorMessage(msg)
      showErrorToast("Registration Error", { description: msg })
    }
  }

  if (successCreated) {
    return (
      <Card className="p-8 bg-card border-border shadow-xl rounded-3xl text-center space-y-5 animate-in zoom-in-95 duration-200">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-success/20 text-success-foreground">
          <CheckCircle2 className="size-8" />
        </div>
        <WebText variant="h3" className="text-foreground">
          Registration Complete!
        </WebText>
        <WebText variant="muted" className="max-w-sm mx-auto">
          We sent a verification link to <strong className="text-foreground">{registeredEmail}</strong>.
          Verify your email or sign in to get started.
        </WebText>
        <div className="pt-3">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => router.push(`/auth/login?redirect=${encodeURIComponent(redirectPath)}`)}
          >
            Go to Sign In
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="w-full animate-in fade-in-50 slide-in-from-bottom-3 duration-300">
      <Card className="p-6 sm:p-8 bg-card border-border shadow-xl rounded-3xl relative overflow-hidden">
        {/* Top accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-primary/20 via-primary to-primary/20" />

        {/* Card Header using WebText */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between">
            <WebText variant="h2" className="text-foreground font-bold">
              Create an account
            </WebText>
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </span>
          </div>
          <WebText variant="muted">
            Join ServiceHub to book top professionals with transparent pricing and verified reviews.
          </WebText>
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

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <FormField label="First Name" required>
              <Input
                placeholder="Jane"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                leftIcon={<User className="size-4" />}
                disabled={isLoading}
                required
              />
            </FormField>

            <FormField label="Last Name">
              <Input
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isLoading}
              />
            </FormField>
          </div>

          {/* Contact Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <FormField label="Email Address" required>
              <Input
                type="email"
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="size-4" />}
                disabled={isLoading}
                required
              />
            </FormField>

            <FormField label="Phone Number">
              <Input
                type="tel"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Phone className="size-4" />}
                disabled={isLoading}
              />
            </FormField>
          </div>

          {/* Passwords Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <FormField label="Password" required hint="At least 8 characters">
              <Input
                type="password"
                placeholder="Create password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="size-4" />}
                disabled={isLoading}
                required
              />
            </FormField>

            <FormField label="Confirm Password" required>
              <Input
                type="password"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="size-4" />}
                disabled={isLoading}
                required
              />
            </FormField>
          </div>

          {/* Password Strength Indicator */}
          {password.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground text-[11px]">Password Strength:</span>
                <span className="font-semibold text-xs">
                  {strengthLabels[strengthScore - 1] || "Too Weak"}
                </span>
              </div>
              <div className="flex h-1.5 w-full gap-1 rounded-full bg-muted overflow-hidden">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-full flex-1 transition-all duration-300 rounded-full ${
                      i < strengthScore
                        ? strengthColors[strengthScore - 1]?.split(" ")[0]
                        : "bg-muted-foreground/20"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Terms Agreement Checkbox */}
          <div className="pt-2">
            <Checkbox
              id="agree-terms"
              checked={agreeTerms}
              onCheckedChange={(checked) => setAgreeTerms(!!checked)}
              label={
                <span className="text-xs">
                  I agree to ServiceHub&apos;s{" "}
                  <Link href="/terms" className="text-primary underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary underline">
                    Privacy Policy
                  </Link>
                </span>
              }
              disabled={isLoading}
            />
          </div>

          {/* Submit CTA */}
          <div className="pt-3">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              rightIcon={<ArrowRight className="size-4.5" />}
            >
              Create Account
            </Button>
          </div>
        </form>

        {/* Existing User Login Link */}
        <div className="mt-6 pt-5 border-t border-border/80 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link
            href={`/auth/login${redirectPath !== "/dashboard" ? `?redirect=${encodeURIComponent(redirectPath)}` : ""}`}
            className="font-semibold text-primary hover:text-primary/80 transition-colors ml-1 underline underline-offset-4"
          >
            Sign in here
          </Link>
        </div>
      </Card>
    </div>
  )
}
