"use client"

import * as React from "react"
import Link from "next/link"
import {
  Briefcase,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  User,
  MapPin,
  Phone,
  Mail,
  RotateCcw,
  ExternalLink,
  ShieldAlert,
  Globe,
  Search,
  FileText,
  Layers,
  Sparkles,
  ArrowRight,
} from "lucide-react"

import { MarketplaceShell } from "@/components/layout/marketplace-shell"
import { StatisticCard } from "@/components/data-display/statistic-card"
import { StatusBadge } from "@/components/data-display/status-badge"
import { Card } from "@/components/data-display/base-card"
import { EmptyState } from "@/components/feedback/empty-state"
import { ErrorState } from "@/components/feedback/error-state"
import { Skeleton, SkeletonText } from "@/components/feedback/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/data-display/pagination"
import { useAppSelector } from "@/lib/hooks"
import { useGetOwnProviderProfileQuery } from "@/features/providers/providers.api"
import { useGetProviderBookingsQuery } from "@/features/bookings/bookings.api"
import { useGetMineServicesQuery } from "@/features/services/services.api"
import type { BookingItem } from "@/features/bookings/bookings.types"
import { cn } from "@/lib/utils"

const ITEMS_PER_PAGE = 10

// Booking status mapping to design system StatusBadge tokens
const statusBadgeConfig: Record<
  string,
  { label: string; status: "success" | "warning" | "processing" | "destructive" | "primary" | "neutral" }
> = {
  PENDING: { label: "Pending Confirmation", status: "warning" },
  CONFIRMED: { label: "Confirmed", status: "success" },
  IN_PROGRESS: { label: "In Progress", status: "processing" },
  COMPLETED: { label: "Completed", status: "success" },
  CANCELLED: { label: "Cancelled", status: "destructive" },
  REJECTED: { label: "Rejected", status: "destructive" },
  EXPIRED: { label: "Expired", status: "neutral" },
  PROVIDER_UNAVAILABLE: { label: "Provider Unavailable", status: "destructive" },
  REASSIGNMENT_PENDING: { label: "Reassignment Pending", status: "warning" },
  NEW_PROVIDER_ASSIGNED: { label: "New Provider Assigned", status: "primary" },
}

const statusGradients: Record<
  string,
  {
    card: string
    topBar: string
    accentDot: string
    refBadge: string
  }
> = {
  PENDING: {
    card: "bg-gradient-to-br from-amber-500/12 via-amber-500/4 to-card border-amber-500/30 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10",
    topBar: "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600",
    accentDot: "bg-amber-500",
    refBadge: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30",
  },
  CONFIRMED: {
    card: "bg-gradient-to-br from-teal-500/12 via-emerald-500/4 to-card border-teal-500/30 hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/10",
    topBar: "bg-gradient-to-r from-teal-400 via-emerald-500 to-teal-600",
    accentDot: "bg-teal-500",
    refBadge: "bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/30",
  },
  IN_PROGRESS: {
    card: "bg-gradient-to-br from-primary/18 via-blue-500/5 to-card border-primary/35 hover:border-primary/55 hover:shadow-lg hover:shadow-primary/15",
    topBar: "bg-gradient-to-r from-primary via-indigo-500 to-blue-600 animate-pulse",
    accentDot: "bg-primary",
    refBadge: "bg-primary/15 text-primary border border-primary/30",
  },
  COMPLETED: {
    card: "bg-gradient-to-br from-emerald-500/12 via-teal-500/4 to-card border-emerald-500/30 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10",
    topBar: "bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600",
    accentDot: "bg-emerald-500",
    refBadge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30",
  },
  CANCELLED: {
    card: "bg-gradient-to-br from-rose-500/12 via-destructive/4 to-card border-destructive/25 hover:border-destructive/40 hover:shadow-lg hover:shadow-destructive/10",
    topBar: "bg-gradient-to-r from-rose-400 via-destructive to-rose-600",
    accentDot: "bg-destructive",
    refBadge: "bg-destructive/15 text-destructive border border-destructive/30",
  },
  REJECTED: {
    card: "bg-gradient-to-br from-rose-500/12 via-destructive/4 to-card border-destructive/25 hover:border-destructive/40 hover:shadow-lg hover:shadow-destructive/10",
    topBar: "bg-gradient-to-r from-rose-400 via-destructive to-rose-600",
    accentDot: "bg-destructive",
    refBadge: "bg-destructive/15 text-destructive border border-destructive/30",
  },
  PROVIDER_UNAVAILABLE: {
    card: "bg-gradient-to-br from-rose-500/12 via-destructive/4 to-card border-destructive/25 hover:border-destructive/40 hover:shadow-lg hover:shadow-destructive/10",
    topBar: "bg-gradient-to-r from-rose-400 via-destructive to-rose-600",
    accentDot: "bg-destructive",
    refBadge: "bg-destructive/15 text-destructive border border-destructive/30",
  },
  REASSIGNMENT_PENDING: {
    card: "bg-gradient-to-br from-amber-500/12 via-amber-500/4 to-card border-amber-500/30 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10",
    topBar: "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600",
    accentDot: "bg-amber-500",
    refBadge: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30",
  },
  NEW_PROVIDER_ASSIGNED: {
    card: "bg-gradient-to-br from-primary/15 via-blue-500/5 to-card border-primary/35 hover:border-primary/55 hover:shadow-lg hover:shadow-primary/15",
    topBar: "bg-gradient-to-r from-primary via-indigo-500 to-blue-600",
    accentDot: "bg-primary",
    refBadge: "bg-primary/15 text-primary border border-primary/30",
  },
}

const defaultBookingGradient = {
  card: "bg-gradient-to-br from-muted/30 via-card to-card border-border hover:border-border/80",
  topBar: "bg-gradient-to-r from-muted-foreground/30 to-muted-foreground/50",
  accentDot: "bg-muted-foreground",
  refBadge: "bg-muted text-muted-foreground border border-border",
}


// Verification status mapping
const verificationBadgeConfig: Record<
  string,
  { label: string; status: "success" | "warning" | "processing" | "destructive" | "neutral" }
> = {
  APPROVED: { label: "Verified Professional", status: "success" },
  PENDING: { label: "Verification Pending Review", status: "warning" },
  DRAFT: { label: "Application Incomplete", status: "neutral" },
  REJECTED: { label: "Verification Rejected", status: "destructive" },
}

// Format date with timezone awareness
function formatDateWithTimezone(isoString: string, timezone?: string): string {
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: timezone || undefined,
    })
  } catch {
    return isoString
  }
}

// Format time with timezone awareness
function formatTimeWithTimezone(isoString: string, timezone?: string): string {
  try {
    const d = new Date(isoString)
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: timezone || undefined,
    })
  } catch {
    return isoString
  }
}

export function ProviderDashboardView() {
  const authUser = useAppSelector((state) => state.auth.user)

  // ---------------------------------------------------------------------------
  // 1. Data Fetching: Provider Own Profile
  // ---------------------------------------------------------------------------
  const {
    data: profile,
    isLoading: isProfileLoading,
    isFetching: isProfileFetching,
    isError: isProfileError,
    error: profileError,
    refetch: refetchProfile,
  } = useGetOwnProviderProfileQuery()

  const hasProfile = Boolean(profile)
  const profileErrorStatus =
    (profileError as { status?: number | string })?.status ||
    (profileError as { data?: { statusCode?: number } })?.data?.statusCode

  const isProfileNotFound = isProfileError && (profileErrorStatus === 404 || profileErrorStatus === "404")

  // ---------------------------------------------------------------------------
  // 2. Filter, Search, and Pagination State for Assigned Bookings
  // ---------------------------------------------------------------------------
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL")
  const [searchInput, setSearchInput] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [page, setPage] = React.useState(1)

  // Debounce search input by 300ms
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchInput.trim()
      setDebouncedSearch((prev) => {
        if (prev !== trimmed) {
          setPage(1)
        }
        return trimmed
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // ---------------------------------------------------------------------------
  // 3. Reliable Global Count Queries (Backend authoritative totals)
  // ---------------------------------------------------------------------------
  const { data: allCountData, refetch: refetchAllCount } = useGetProviderBookingsQuery(
    { limit: 1 },
    { skip: !hasProfile }
  )
  const { data: pendingCountData, refetch: refetchPendingCount } = useGetProviderBookingsQuery(
    { status: "PENDING", limit: 1 },
    { skip: !hasProfile }
  )
  const { data: confirmedCountData, refetch: refetchConfirmedCount } = useGetProviderBookingsQuery(
    { status: "CONFIRMED", limit: 1 },
    { skip: !hasProfile }
  )
  const { data: inProgressCountData, refetch: refetchInProgressCount } = useGetProviderBookingsQuery(
    { status: "IN_PROGRESS", limit: 1 },
    { skip: !hasProfile }
  )
  const { data: completedCountData, refetch: refetchCompletedCount } = useGetProviderBookingsQuery(
    { status: "COMPLETED", limit: 1 },
    { skip: !hasProfile }
  )

  const totalAssignedCount = allCountData?.total ?? 0
  const pendingCount = pendingCountData?.total ?? 0
  const confirmedCount = confirmedCountData?.total ?? 0
  const inProgressCount = inProgressCountData?.total ?? 0
  const completedCount = completedCountData?.total ?? 0

  // ---------------------------------------------------------------------------
  // 4. Main Assigned Bookings Query (Server-side search, status, and pagination)
  // ---------------------------------------------------------------------------
  const {
    data: bookingsData,
    isLoading: isBookingsLoading,
    isFetching: isBookingsFetching,
    isError: isBookingsError,
    refetch: refetchBookings,
  } = useGetProviderBookingsQuery(
    {
      page,
      limit: ITEMS_PER_PAGE,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      search: debouncedSearch || undefined,
      sortBy: "createdAt",
      sortOrder: "desc",
    },
    { skip: !hasProfile }
  )

  // ---------------------------------------------------------------------------
  // 5. Provider Own Services Query
  // ---------------------------------------------------------------------------
  const {
    data: myServices,
    isLoading: isServicesLoading,
    refetch: refetchServices,
  } = useGetMineServicesQuery(undefined, { skip: !hasProfile })

  // Refresh all dashboard queries
  const handleRefreshAll = () => {
    refetchProfile()
    refetchAllCount()
    refetchPendingCount()
    refetchConfirmedCount()
    refetchInProgressCount()
    refetchCompletedCount()
    refetchBookings()
    refetchServices()
  }

  // Authoritative server-side booking items directly consumed from backend
  const bookingItems = React.useMemo(() => {
    return bookingsData?.items || []
  }, [bookingsData?.items])

  const totalPages = bookingsData?.totalPages || 1
  const totalItems = bookingsData?.total || 0

  // Derive welcome name
  const welcomeName =
    profile?.displayName ||
    `${authUser?.firstName || ""} ${authUser?.lastName || ""}`.trim() ||
    "Service Provider"

  const providerTimezone = profile?.timezone || "UTC"
  const verificationCfg = profile?.verification?.status
    ? verificationBadgeConfig[profile.verification.status] || {
        label: profile.verification.status,
        status: "neutral" as const,
      }
    : null

  // =========================================================================
  // State 1: Profile Loading Skeleton
  // =========================================================================
  if (isProfileLoading) {
    return (
      <MarketplaceShell currentRole="SERVICE_PROVIDER" breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Provider Overview" }]}>
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 rounded-lg" />
            <Skeleton className="h-4 w-96 rounded-md" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="p-5 space-y-3">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-8 w-16 rounded" />
              </Card>
            ))}
          </div>

          <Card className="p-6 space-y-4">
            <Skeleton className="h-6 w-48 rounded" />
            <SkeletonText lines={4} />
          </Card>
        </div>
      </MarketplaceShell>
    )
  }

  // =========================================================================
  // State 2: Profile Not Found (Onboarding Incomplete)
  // =========================================================================
  if (isProfileNotFound) {
    return (
      <MarketplaceShell currentRole="SERVICE_PROVIDER" breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Provider Overview" }]}>
        <div className="py-8">
          <EmptyState
            icon={<Briefcase className="size-8 text-primary" />}
            title="Provider Profile Setup Required"
            description="Your user account is assigned the Service Provider role, but your provider business profile has not been initialized yet. Once profile registration and verification are completed, your operational dashboard, assigned customer bookings, and service catalog will appear here."
            action={
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" asChild>
                  <Link href="/services">Browse Public Services</Link>
                </Button>
                <Button variant="primary" onClick={() => refetchProfile()} leftIcon={<RotateCcw className="size-4" />}>
                  Check Profile Again
                </Button>
              </div>
            }
          />
        </div>
      </MarketplaceShell>
    )
  }

  // =========================================================================
  // State 3: Generic Profile Error
  // =========================================================================
  if (isProfileError || !profile) {
    const errorMsg =
      (profileError as { data?: { message?: string | string[] } })?.data?.message ||
      "Could not load provider profile details. Please verify your connection."

    return (
      <MarketplaceShell currentRole="SERVICE_PROVIDER" breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Provider Overview" }]}>
        <div className="py-8">
          <ErrorState
            title="Failed to Load Provider Profile"
            message={Array.isArray(errorMsg) ? errorMsg.join(", ") : String(errorMsg)}
            onRetry={() => refetchProfile()}
            retryLabel="Retry Loading Dashboard"
          />
        </div>
      </MarketplaceShell>
    )
  }

  // =========================================================================
  // State 4: Normal Operational Provider Dashboard View
  // =========================================================================
  return (
    <MarketplaceShell
      currentRole="SERVICE_PROVIDER"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Provider Overview" },
      ]}
    >
      <div className="space-y-8">
        {/* =================================================================== */}
        {/* 1. Welcome & Operational Header */}
        {/* =================================================================== */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Welcome back, {welcomeName}!
              </h1>
              {verificationCfg && (
                <StatusBadge status={verificationCfg.status} hasDot>
                  {verificationCfg.label}
                </StatusBadge>
              )}
              {profile.status === "ACTIVE" ? (
                <span className="text-[11px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/20">
                  Active Provider
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full border border-destructive/20">
                  Suspended
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Globe className="size-3.5 text-primary" />
                <span>
                  Operating Timezone: <strong>{providerTimezone}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-primary" />
                <span>
                  Service Areas: <strong>{profile.serviceAreas?.length || 0} registered</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              disabled={isProfileFetching || isBookingsFetching}
              leftIcon={<RotateCcw className={cn("size-3.5", (isProfileFetching || isBookingsFetching) && "animate-spin")} />}
            >
              <span>Refresh</span>
            </Button>
            <Button variant="primary" size="sm" asChild>
              <Link href="/services">Browse Marketplace</Link>
            </Button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 2. Onboarding & Verification Status Banners */}
        {/* =================================================================== */}
        {profile.verification?.status === "PENDING" && (
          <div className="p-4 rounded-2xl bg-warning/10 border border-warning/30 flex items-start gap-3 text-xs text-foreground">
            <AlertCircle className="size-5 text-warning shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="font-bold text-sm text-foreground">Verification Application Pending Administrative Review</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your service provider credentials and documentation have been submitted and are currently under review by our administration team. You can explore your dashboard while approval is processed.
              </p>
            </div>
          </div>
        )}

        {profile.verification?.status === "REJECTED" && (
          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 flex items-start gap-3 text-xs text-destructive">
            <ShieldAlert className="size-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="font-bold text-sm">Provider Verification Application Needs Revision</h2>
              <p className="leading-relaxed">
                Your verification application was rejected: &ldquo;{profile.verification.rejectionReason || "Requirements not met."}&rdquo; Please contact support or update your credentials to resubmit.
              </p>
            </div>
          </div>
        )}

        {profile.status === "SUSPENDED" && (
          <div className="p-4 rounded-2xl bg-destructive/15 border border-destructive/40 flex items-start gap-3 text-xs text-destructive">
            <AlertTriangle className="size-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="font-bold text-sm">Account Temporarily Suspended</h2>
              <p className="leading-relaxed">
                Your provider profile is currently marked suspended. While suspended, customers cannot book your services. Please contact platform administration to restore active operational status.
              </p>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 3. Operational Overview: Booking Summary Cards */}
        {/* =================================================================== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Briefcase className="size-4 text-primary" />
              Operational Booking Summary
            </h2>
            <span className="text-xs text-muted-foreground">
              Authoritative platform metrics
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatisticCard
              title="Total Assigned"
              value={totalAssignedCount}
              icon={<Briefcase className="size-5" />}
              description="All assigned bookings"
              gradient="blue"
            />
            <StatisticCard
              title="Pending Confirmation"
              value={pendingCount}
              icon={<AlertCircle className="size-5 text-warning" />}
              description="Awaiting approval"
              gradient="amber"
            />
            <StatisticCard
              title="Confirmed"
              value={confirmedCount}
              icon={<CheckCircle2 className="size-5 text-success" />}
              description="Ready to deliver"
              gradient="teal"
            />
            <StatisticCard
              title="In Progress"
              value={inProgressCount}
              icon={<Clock className="size-5 text-primary" />}
              description="Currently active"
              gradient="primary"
            />
            <StatisticCard
              title="Completed"
              value={completedCount}
              icon={<TrendingUp className="size-5 text-success" />}
              description="Successfully delivered"
              gradient="emerald"
            />
          </div>
        </div>

        {/* =================================================================== */}
        {/* 4. Assigned Appointments & Bookings Management Section */}
        {/* =================================================================== */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Calendar className="size-4 text-primary" />
                Assigned Appointments
              </h2>
              <p className="text-xs text-muted-foreground">
                Manage appointments assigned to your service provider profile
              </p>
            </div>

            {/* Quick Search */}
            <div className="w-full sm:w-64 relative">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search appointments..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: "ALL", label: `All Assigned (${totalAssignedCount})` },
              { id: "PENDING", label: `Pending (${pendingCount})` },
              { id: "CONFIRMED", label: `Confirmed (${confirmedCount})` },
              { id: "IN_PROGRESS", label: `In Progress (${inProgressCount})` },
              { id: "COMPLETED", label: `Completed (${completedCount})` },
              { id: "CANCELLED", label: "Cancelled" },
            ].map((tab) => {
              const isSelected = statusFilter === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setStatusFilter(tab.id)
                    setPage(1)
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  )}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Bookings Content */}
          {isBookingsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Card key={idx} className="p-5 space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-32 rounded" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                  <SkeletonText lines={2} />
                </Card>
              ))}
            </div>
          ) : isBookingsError ? (
            <div className="py-4">
              <ErrorState
                title="Could Not Load Assigned Bookings"
                message="There was an issue fetching your assigned bookings. Please verify your connection."
                onRetry={() => refetchBookings()}
                retryLabel="Retry Bookings"
              />
            </div>
          ) : bookingItems.length === 0 ? (
            <Card className="p-8 text-center bg-card border-border">
              <EmptyState
                icon={<Calendar className="size-8 text-muted-foreground" />}
                title={statusFilter === "ALL" ? "No Assigned Bookings Yet" : `No ${statusFilter.toLowerCase()} bookings found`}
                description={
                  statusFilter === "ALL"
                    ? "When customers select your available slots and book appointments, they will appear here."
                    : `There are currently no bookings with status "${statusFilter}". Try selecting another filter tab or resetting your search.`
                }
                action={
                  statusFilter !== "ALL" || debouncedSearch ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setStatusFilter("ALL")
                        setSearchInput("")
                        setPage(1)
                      }}
                    >
                      Show All Assigned Bookings
                    </Button>
                  ) : undefined
                }
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {bookingItems.map((booking: BookingItem) => {
                const statusCfg = statusBadgeConfig[booking.status] || {
                  label: booking.status,
                  status: "neutral" as const,
                }
                const grad = statusGradients[booking.status] || defaultBookingGradient

                return (
                  <Card
                    key={booking.id}
                    className={cn(
                      "p-5 space-y-4 relative overflow-hidden transition-all duration-200 shadow-2xs hover:shadow-md",
                      grad.card
                    )}
                  >
                    {/* Top Gradient Accent Stripe */}
                    <div className={cn("absolute top-0 left-0 right-0 h-1.5", grad.topBar)} />

                    {/* Header: Reference ID + Status Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/70">
                      <div className="flex items-center gap-2">
                        <span className={cn("size-2 rounded-full shrink-0", grad.accentDot)} />
                        <Link
                          href={`/bookings/${booking.id}`}
                          className={cn(
                            "text-xs font-mono font-bold px-2.5 py-1 rounded-md transition-colors hover:underline",
                            grad.refBadge
                          )}
                        >
                          #{booking.id}
                        </Link>
                        {booking.createdAt && (
                          <span className="text-[11px] text-muted-foreground">
                            Booked on {formatDateWithTimezone(booking.createdAt, providerTimezone)}
                          </span>
                        )}
                      </div>

                      <StatusBadge status={statusCfg.status} hasDot>
                        {statusCfg.label}
                      </StatusBadge>
                    </div>

                    {/* Main Grid: Service, Schedule, Customer, Location */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start text-xs">
                      {/* Left: Service & Appointment Time */}
                      <div className="space-y-1.5">
                        <h3 className="text-sm sm:text-base font-bold text-foreground">
                          {booking.serviceId ? (
                            <Link
                              href={`/services/${booking.serviceId}`}
                              className="hover:text-primary transition-colors inline-block"
                            >
                              {booking.serviceName}
                            </Link>
                          ) : (
                            booking.serviceName
                          )}
                        </h3>

                        <div className="flex items-center gap-1.5 text-primary font-semibold">
                          <Calendar className="size-3.5 shrink-0" />
                          <span>{formatDateWithTimezone(booking.startAt, providerTimezone)}</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="size-3.5 shrink-0" />
                          <span>
                            {formatTimeWithTimezone(booking.startAt, providerTimezone)} -{" "}
                            {formatTimeWithTimezone(booking.endAt, providerTimezone)} ({booking.serviceDurationMinutes} mins)
                          </span>
                        </div>
                      </div>

                      {/* Middle: Customer Details & Location */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-foreground font-medium">
                          <User className="size-3.5 text-primary shrink-0" />
                          <span>
                            Customer:{" "}
                            <strong className="font-semibold">
                              {booking.customer
                                ? `${booking.customer.firstName} ${booking.customer.lastName || ""}`.trim()
                                : "Registered Customer"}
                            </strong>
                          </span>
                        </div>

                        {booking.customer?.email && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Mail className="size-3.5 shrink-0" />
                            <span className="truncate">{booking.customer.email}</span>
                          </div>
                        )}

                        {booking.customer?.phone && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="size-3.5 shrink-0" />
                            <span>{booking.customer.phone}</span>
                          </div>
                        )}

                        {booking.location && (
                          <div className="flex items-start gap-1.5 text-muted-foreground pt-0.5">
                            <MapPin className="size-3.5 text-primary shrink-0 mt-0.5" />
                            <span className="truncate">
                              {booking.location.address}, {booking.location.city}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right: Price & View Details Action */}
                      <div className="flex flex-col md:items-end justify-between space-y-3">
                        <div>
                          <span className="text-[11px] text-muted-foreground block md:text-right">
                            Total Payout
                          </span>
                          <span className="text-lg sm:text-xl font-extrabold text-foreground md:text-right block">
                            ${booking.finalAmount.toFixed(2)} USD
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" asChild className="text-xs">
                            <Link href={`/bookings/${booking.id}`}>
                              View Full Details
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Customer Instructions Snippet */}
                    {booking.customerNote && (
                      <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 text-xs">
                        <span className="font-semibold text-foreground flex items-center gap-1 mb-0.5">
                          <FileText className="size-3 text-primary" /> Customer Instructions:
                        </span>
                        <p className="text-muted-foreground italic leading-relaxed">
                          &ldquo;{booking.customerNote}&rdquo;
                        </p>
                      </div>
                    )}
                  </Card>
                )
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pt-4 border-t border-border mt-6">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    pageSize={ITEMS_PER_PAGE}
                    onPageChange={(newPage) => {
                      setPage(newPage)
                      if (typeof window !== "undefined") {
                        window.scrollTo({ top: 300, behavior: "smooth" })
                      }
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* =================================================================== */}
        {/* 5. Registered Catalog Services Section */}
        {/* =================================================================== */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                My Registered Services ({myServices?.length || 0})
              </h2>
              <p className="text-xs text-muted-foreground">
                Services published under your service provider catalog
              </p>
            </div>

            <Button variant="outline" size="sm" asChild className="text-xs">
              <Link href="/services">
                Browse All Marketplace Services
              </Link>
            </Button>
          </div>

          {isServicesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4 rounded" />
                  <Skeleton className="h-4 w-1/2 rounded" />
                </Card>
              ))}
            </div>
          ) : !myServices || myServices.length === 0 ? (
            <Card className="p-6 text-center bg-card border-border">
              <EmptyState
                icon={<Layers className="size-7 text-muted-foreground" />}
                title="No Services Registered"
                description="You have not published any services under your provider account yet. Services added by platform administrators or via catalog onboarding will be listed here."
                action={
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/services">Explore Marketplace Catalog</Link>
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myServices.map((service) => (
                <Card
                  key={service.id}
                  className="p-4 bg-card border-border hover:border-primary/40 transition-colors shadow-2xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                        {service.category?.name || "General"}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full",
                          service.status === "ACTIVE"
                            ? "bg-success/15 text-success border border-success/30"
                            : "bg-muted text-muted-foreground border border-border"
                        )}
                      >
                        {service.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-foreground">
                      <Link href={`/services/${service.id}`} className="hover:text-primary transition-colors">
                        {service.name}
                      </Link>
                    </h3>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/70 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="size-3" />
                      <span>{service.durationMinutes} mins</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-foreground text-sm">
                        ${service.price.toFixed(2)}
                      </span>
                      <Button variant="ghost" size="sm" asChild className="size-7 p-0">
                        <Link href={`/services/${service.id}`} title="View service details">
                          <ExternalLink className="size-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* =================================================================== */}
        {/* 6. Quick Links & Platform Navigation */}
        {/* =================================================================== */}
        <div className="p-5 rounded-2xl bg-muted/30 border border-border space-y-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <Sparkles className="size-4 text-primary" />
            <span>Platform Modules & Quick Navigation</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <Link
              href="/services"
              className="p-3 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors flex items-center justify-between group"
            >
              <div>
                <span className="font-bold text-foreground block">Marketplace Services</span>
                <span className="text-[11px] text-muted-foreground">Browse all public catalog offerings</span>
              </div>
              <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/bookings"
              className="p-3 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors flex items-center justify-between group"
            >
              <div>
                <span className="font-bold text-foreground block">Customer Bookings</span>
                <span className="text-[11px] text-muted-foreground">View all customer appointment lists</span>
              </div>
              <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/dashboard"
              className="p-3 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors flex items-center justify-between group"
            >
              <div>
                <span className="font-bold text-foreground block">Dashboard Portal</span>
                <span className="text-[11px] text-muted-foreground">Switch or view main role portal</span>
              </div>
              <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <p className="text-[11px] text-muted-foreground pt-1">
            Note: Provider working hour availability slots management and service catalog authoring tools will be integrated in upcoming Phase 3 provider workflows.
          </p>
        </div>
      </div>
    </MarketplaceShell>
  )
}
