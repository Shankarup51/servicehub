"use client"

import * as React from "react"
import Link from "next/link"
import { ShieldAlert, ArrowLeft, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/data-display/base-card"
import { useLogoutMutation } from "@/features/auth/auth.api"
import { useRouter } from "next/navigation"
import { useAppSelector } from "@/lib/hooks"

export default function UnauthorizedPage() {
  const router = useRouter()
  const user = useAppSelector((state) => state.auth.user)
  const [logout, { isLoading }] = useLogoutMutation()

  const hasAnyRole = React.useMemo(() => {
    if (!user) return false
    if (Array.isArray(user.roles) && user.roles.length > 0) return true
    if (user.role && user.role.trim().length > 0) return true
    return false
  }, [user])

  const handleLogout = async () => {
    try {
      await logout().unwrap()
    } finally {
      router.replace("/auth/login")
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white rounded-2xl border border-[#E5E5E5] p-6 sm:p-8 shadow-sm text-center space-y-6">
        <div className="size-16 rounded-2xl bg-[#C74747]/10 text-[#C74747] flex items-center justify-center mx-auto">
          <ShieldAlert className="size-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold text-[#242424]">
            {!hasAnyRole ? "No Role Assigned" : "Access Restricted"}
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B] leading-relaxed">
            {!hasAnyRole
              ? "Your account currently has no assigned role and cannot access any area of ServiceHub. Please go to the login page and sign in with other credentials."
              : "Your account does not have the required permissions or assigned role to access this area."}
          </p>
        </div>

        <div className="pt-2 flex flex-col items-center justify-center gap-3 w-full">
          {/* Primary Action: Go to Login Page and Sign In with other credentials */}
          <Button
            size="default"
            onClick={handleLogout}
            disabled={isLoading}
            className="w-full bg-[#AD8066] hover:bg-[#94684F] text-white font-medium text-xs sm:text-sm h-10 shadow-xs"
          >
            <KeyRound className="size-4 mr-2" /> Go to Login Page & Sign In with Other Credentials
          </Button>

          {/* If the user DOES have an assigned role, allow returning to their dashboard */}
          {hasAnyRole && (
            <Button variant="outline" size="sm" asChild className="w-full text-xs border-[#E5E5E5]">
              <Link href="/dashboard">
                <ArrowLeft className="size-3.5 mr-1.5" /> Return to My Dashboard
              </Link>
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
