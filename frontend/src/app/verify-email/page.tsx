"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Mail,
  KeyRound,
  RefreshCw,
  Home,
  LogIn,
} from "lucide-react"

import { useVerifyEmailMutation } from "@/features/auth/auth.api"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageContainer } from "@/components/layout/page-container"
import { Card } from "@/components/data-display/base-card"
import { WebText } from "@/components/ui/web-text"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/feedback/spinner"

type VerificationState = "verifying" | "success" | "error" | "input"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const initialToken = searchParams.get("token") || ""

  const [verifyEmail, { isLoading }] = useVerifyEmailMutation()

  const [state, setState] = React.useState<VerificationState>(
    initialToken ? "verifying" : "input"
  )
  const [tokenInput, setTokenInput] = React.useState(initialToken)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)

  const executedRef = React.useRef(false)

  const handleVerify = React.useCallback(
    async (tokenToVerify: string) => {
      const cleanToken = tokenToVerify.trim()
      if (!cleanToken) {
        setErrorMessage("Please provide a valid verification token.")
        setState("error")
        return
      }

      setState("verifying")
      setErrorMessage(null)

      try {
        const response = await verifyEmail({ token: cleanToken }).unwrap()
        setSuccessMessage(response.message || "Your email address has been verified successfully.")
        setState("success")
      } catch (err: unknown) {
        const error = err as { data?: { message?: string | string[] } }
        const msg =
          Array.isArray(error.data?.message)
            ? error.data?.message.join(", ")
            : error.data?.message || "Invalid, expired, or already used verification token."

        setErrorMessage(msg)
        setState("error")
      }
    },
    [verifyEmail]
  )

  // Auto-verify if token is present in URL
  React.useEffect(() => {
    if (initialToken && !executedRef.current) {
      executedRef.current = true
      handleVerify(initialToken)
    }
  }, [initialToken, handleVerify])

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleVerify(tokenInput)
  }

  return (
    <div className="w-full max-w-lg mx-auto animate-in fade-in-50 slide-in-from-bottom-3 duration-300">
      <Card className="p-6 sm:p-10 bg-card border-border shadow-xl rounded-3xl relative overflow-hidden">
        {/* Subtle decorative maroon accent line */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-primary/30 via-primary to-primary/30" />

        {/* 1. VERIFYING STATE */}
        {state === "verifying" && (
          <div className="py-8 flex flex-col items-center text-center space-y-6">
            <div className="relative">
              <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <Spinner size="lg" className="text-primary size-10" />
              </div>
              <div className="absolute -bottom-1 -right-1 size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                <ShieldCheck className="size-4" />
              </div>
            </div>

            <div className="space-y-2">
              <WebText variant="h2" className="text-foreground font-bold tracking-tight">
                Verifying Your Email
              </WebText>
              <WebText variant="muted" className="max-w-sm">
                Please wait while we confirm your security credentials with the ServiceHub network.
              </WebText>
            </div>
          </div>
        )}

        {/* 2. SUCCESS STATE */}
        {state === "success" && (
          <div className="py-6 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="relative">
              <div className="size-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-600 shadow-sm">
                <CheckCircle2 className="size-11 stroke-[2.5]" />
              </div>
              <div className="absolute -top-1 -right-1 size-6 rounded-full bg-primary text-white flex items-center justify-center shadow-xs">
                <Sparkles className="size-3.5" />
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-semibold">
                <CheckCircle2 className="size-3.5" />
                <span>Account Activated</span>
              </div>
              <WebText variant="h2" className="text-foreground font-bold tracking-tight">
                Email Verified Successfully!
              </WebText>
              <WebText variant="muted" className="max-w-sm leading-relaxed">
                {successMessage ||
                  "Your email address has been verified. You can now sign in to your ServiceHub account to explore pros or manage bookings."}
              </WebText>
            </div>

            <div className="w-full pt-3 flex flex-col sm:flex-row gap-3">
              <Button variant="primary" size="lg" fullWidth asChild>
                <Link href="/auth/login" className="flex items-center justify-center gap-2">
                  <LogIn className="size-4" />
                  <span>Sign In to Account</span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* 3. ERROR STATE */}
        {state === "error" && (
          <div className="py-6 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="size-20 rounded-full bg-destructive/15 border-2 border-destructive/30 flex items-center justify-center text-destructive shadow-sm">
              <XCircle className="size-11 stroke-[2.5]" />
            </div>

            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-semibold">
                <XCircle className="size-3.5" />
                <span>Verification Unsuccessful</span>
              </div>
              <WebText variant="h2" className="text-foreground font-bold tracking-tight">
                Verification Failed
              </WebText>
              <WebText variant="muted" className="max-w-sm leading-relaxed">
                {errorMessage ||
                  "This email verification link is invalid, has expired (valid for 24 hours), or has already been used."}
              </WebText>
            </div>

            <div className="w-full space-y-3 pt-2">
              <Button
                variant="outline"
                size="default"
                fullWidth
                onClick={() => {
                  setState("input")
                  setErrorMessage(null)
                }}
                leftIcon={<RefreshCw className="size-4" />}
              >
                Enter Token Manually
              </Button>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <Button variant="primary" size="default" fullWidth asChild>
                  <Link href="/auth/login">Go to Sign In</Link>
                </Button>
                <Button variant="ghost" size="default" fullWidth asChild>
                  <Link href="/auth/register">Create New Account</Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 4. MANUAL INPUT STATE */}
        {state === "input" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <WebText variant="h2" className="text-foreground font-bold">
                  Verify Email
                </WebText>
                <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Mail className="size-4" />
                </span>
              </div>
              <WebText variant="muted">
                Paste the security verification token from your ServiceHub email below to confirm your
                account.
              </WebText>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="flex items-start gap-2.5 p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs animate-in fade-in duration-200"
              >
                <XCircle className="size-4 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="verification-token"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Verification Token
                </label>
                <Input
                  id="verification-token"
                  type="text"
                  placeholder="Paste token (e.g. 7f9e4d...)"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  leftIcon={<KeyRound className="size-4" />}
                  disabled={isLoading}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
                rightIcon={<ArrowRight className="size-4" />}
              >
                Verify Email Address
              </Button>
            </form>

            <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <Link
                href="/auth/login"
                className="font-medium text-primary hover:underline hover:text-primary/90 transition-colors"
              >
                Already verified? Sign in
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <Home className="size-3.5" />
                <span>Return Home</span>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

function VerifyEmailSkeleton() {
  return (
    <div className="w-full max-w-lg mx-auto p-8 rounded-3xl bg-card border border-border flex flex-col items-center justify-center space-y-4">
      <Spinner size="lg" className="text-primary size-10" />
      <p className="text-sm text-muted-foreground">Loading verification portal...</p>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20 selection:text-primary">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6">
        <PageContainer maxWidth="md">
          <React.Suspense fallback={<VerifyEmailSkeleton />}>
            <VerifyEmailContent />
          </React.Suspense>
        </PageContainer>
      </main>

      <Footer />
    </div>
  )
}
