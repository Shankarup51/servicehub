"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Briefcase,
  ArrowRight,
} from "lucide-react"

import { MarketplaceShell } from "@/components/layout/marketplace-shell"
import { ServiceCard } from "@/components/data-display/service-card"
import { BookingCard, type BookingStatus as BookingCardStatus } from "@/components/data-display/booking-card"
import { StatisticCard } from "@/components/data-display/statistic-card"
import { EmptyState } from "@/components/feedback/empty-state"
import { ErrorState } from "@/components/feedback/error-state"
import { SkeletonCard } from "@/components/feedback/skeleton"
import { Button } from "@/components/ui/button"
import { useAppSelector } from "@/lib/hooks"
import { useGetServicesQuery } from "@/features/services/services.api"
import { useGetMyBookingsQuery } from "@/features/bookings/bookings.api"
import type { ServiceListItem } from "@/features/services/services.types"
import type { BookingItem } from "@/features/bookings/bookings.types"

// Date & time helpers with deterministic en-US locale to prevent hydration mismatch
function formatDateFriendly(isoString: string): string {
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return isoString
  }
}

function formatTimeOnly(isoString: string): string {
  try {
    const d = new Date(isoString)
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })
  } catch {
    return isoString
  }
}

// Safely extract uploaded service image URL from dynamic API response
function getServiceImage(service: ServiceListItem): string | undefined {
  const primaryImg = service.images?.find((img) => img.isPrimary) || service.images?.[0]
  if (
    primaryImg?.storageKey &&
    (primaryImg.storageKey.startsWith("http://") ||
      primaryImg.storageKey.startsWith("https://") ||
      primaryImg.storageKey.startsWith("/"))
  ) {
    return primaryImg.storageKey
  }
  return undefined
}

// Safe mapping for BookingCard status
function mapBookingStatus(status: string): BookingCardStatus {
  switch (status) {
    case "CONFIRMED":
      return "CONFIRMED"
    case "IN_PROGRESS":
      return "IN_PROGRESS"
    case "COMPLETED":
      return "COMPLETED"
    case "CANCELLED":
    case "REJECTED":
      return "CANCELLED"
    case "PENDING":
    default:
      return "PENDING"
  }
}

export function CustomerDashboardView() {
  const router = useRouter()
  const authUser = useAppSelector((state) => state.auth.user)

  // 1. Authenticated Customer's Recent Bookings (limit: 4 for preview)
  const {
    data: recentBookingsResponse,
    isLoading: isRecentBookingsLoading,
    isError: isRecentBookingsError,
    refetch: refetchRecentBookings,
  } = useGetMyBookingsQuery({ page: 1, limit: 4, sortBy: "createdAt", sortOrder: "desc" })

  const recentBookings = React.useMemo(
    () => recentBookingsResponse?.items || [],
    [recentBookingsResponse?.items]
  )
  const totalBookingsCount = recentBookingsResponse?.total ?? 0

  // Authoritative server-side status count queries (limit: 1 for minimal payload)
  const { data: completedCountData, isLoading: isCompletedLoading, refetch: refetchCompleted } =
    useGetMyBookingsQuery({ status: "COMPLETED", limit: 1 })
  const { data: pendingCountData, isLoading: isPendingLoading, refetch: refetchPending } =
    useGetMyBookingsQuery({ status: "PENDING", limit: 1 })
  const { data: confirmedCountData, isLoading: isConfirmedLoading, refetch: refetchConfirmed } =
    useGetMyBookingsQuery({ status: "CONFIRMED", limit: 1 })
  const { data: inProgressCountData, isLoading: isInProgressLoading, refetch: refetchInProgress } =
    useGetMyBookingsQuery({ status: "IN_PROGRESS", limit: 1 })
  const { data: reassignmentCountData, isLoading: isReassignmentLoading, refetch: refetchReassignment } =
    useGetMyBookingsQuery({ status: "REASSIGNMENT_PENDING", limit: 1 })
  const { data: newProviderCountData, isLoading: isNewProviderLoading, refetch: refetchNewProvider } =
    useGetMyBookingsQuery({ status: "NEW_PROVIDER_ASSIGNED", limit: 1 })

  const activeBookingsCount =
    (pendingCountData?.total ?? 0) +
    (confirmedCountData?.total ?? 0) +
    (inProgressCountData?.total ?? 0) +
    (reassignmentCountData?.total ?? 0) +
    (newProviderCountData?.total ?? 0)

  const completedBookingsCount = completedCountData?.total ?? 0

  const isActiveCountLoading =
    isPendingLoading ||
    isConfirmedLoading ||
    isInProgressLoading ||
    isReassignmentLoading ||
    isNewProviderLoading

  const refetchAllBookings = React.useCallback(() => {
    refetchRecentBookings()
    refetchCompleted()
    refetchPending()
    refetchConfirmed()
    refetchInProgress()
    refetchReassignment()
    refetchNewProvider()
  }, [
    refetchRecentBookings,
    refetchCompleted,
    refetchPending,
    refetchConfirmed,
    refetchInProgress,
    refetchReassignment,
    refetchNewProvider,
  ])

  // 2. Featured Services for Marketplace Preview (limit: 6)
  const {
    data: servicesResponse,
    isLoading: isServicesLoading,
    isError: isServicesError,
    refetch: refetchServices,
  } = useGetServicesQuery({
    page: 1,
    limit: 6,
  })

  const rawServices = React.useMemo(() => servicesResponse?.data || [], [servicesResponse?.data])
  const servicesMeta = servicesResponse?.meta || {
    total: 0,
    page: 1,
    limit: 6,
    totalPages: 1,
  }

  const customerDisplayName = authUser?.firstName
    ? `${authUser.firstName}${authUser.lastName ? ` ${authUser.lastName}` : ""}`
    : "Customer"

  return (
    <MarketplaceShell
      currentRole="CUSTOMER"
      breadcrumbs={[{ label: "Customer Dashboard" }]}
      heading={`Welcome back, ${customerDisplayName}!`}
      subheading="Explore verified service professionals, track your active bookings, and schedule trusted home care."
    >
      <div className="space-y-8">
        {/* Customer KPI Metric Cards Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatisticCard
            title="Active Bookings"
            value={isActiveCountLoading ? "..." : activeBookingsCount}
            icon={<Clock className="size-5" />}
            description="Pending or in-progress services"
            gradient="amber"
          />
          <StatisticCard
            title="Completed Services"
            value={isCompletedLoading ? "..." : completedBookingsCount}
            icon={<CheckCircle2 className="size-5" />}
            description="Services successfully delivered"
            gradient="emerald"
          />
          <StatisticCard
            title="Total Bookings"
            value={isRecentBookingsLoading ? "..." : totalBookingsCount}
            icon={<Briefcase className="size-5" />}
            description="Lifetime service orders placed"
            gradient="blue"
          />
          <StatisticCard
            title="Explore Services"
            value={isServicesLoading ? "..." : servicesMeta.total}
            icon={<Sparkles className="size-5" />}
            description="Verified catalog ready to book"
            gradient="purple"
          />
        </div>

        {/* My Recent Bookings Section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-primary" />
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                  My Recent Bookings
                </h2>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Track your requested services, assigned service professionals, and live booking status.
              </p>
            </div>
            {totalBookingsCount > 0 && (
              <Button variant="outline" size="sm" asChild className="text-xs self-start sm:self-auto font-medium">
                <Link href="/bookings" className="flex items-center gap-1.5">
                  <span>View All Bookings ({totalBookingsCount})</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            )}
          </div>

          {/* Bookings Display States */}
          {isRecentBookingsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : isRecentBookingsError ? (
            <ErrorState
              title="Failed to load your bookings"
              message="An error occurred while fetching your scheduled bookings. Please try again."
              onRetry={() => refetchAllBookings()}
            />
          ) : recentBookings.length === 0 ? (
            <EmptyState
              icon={<Calendar className="size-6 text-primary" />}
              title="No bookings placed yet"
              description="You haven't booked any services yet. Discover verified professionals below and schedule your first home service!"
              className="border-border bg-muted/20 py-8"
              action={
                <Button variant="primary" size="sm" asChild leftIcon={<Sparkles className="size-4" />}>
                  <Link href="/services">Explore Services Catalog</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentBookings.map((booking: BookingItem) => {
                const bookingRef = `BK-${String(booking.id).padStart(4, "0")}`
                const serviceTitle =
                  booking.serviceName || booking.service?.name || "Service Booking"
                const providerName =
                  booking.provider?.displayName || "Verified Service Professional"
                const addressStr = booking.location
                  ? `${booking.location.address}, ${booking.location.area}, ${booking.location.city}`
                  : "Address on file"
                const amount = Number(booking.finalAmount ?? booking.servicePrice ?? 0)

                return (
                  <BookingCard
                    key={booking.id}
                    id={String(booking.id)}
                    bookingReference={bookingRef}
                    serviceTitle={serviceTitle}
                    partyName={providerName}
                    partyRole="Provider"
                    status={mapBookingStatus(booking.status)}
                    scheduledDate={formatDateFriendly(booking.startAt)}
                    scheduledTime={`${formatTimeOnly(booking.startAt)} – ${formatTimeOnly(booking.endAt)}`}
                    address={addressStr}
                    totalAmount={amount}
                    href={`/bookings/${booking.id}`}
                    onView={() => router.push(`/bookings/${booking.id}`)}
                  />
                )
              })}
            </div>
          )}
        </section>

        {/* Featured Services Marketplace Section */}
        <section className="space-y-4 pt-4 border-t border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Briefcase className="size-4 text-primary" />
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                  Featured Home Services
                </h2>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Transparent pricing, background-checked pros, and guaranteed service warranty.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild className="text-xs self-start sm:self-auto font-medium">
              <Link href="/services" className="flex items-center gap-1.5">
                <span>Explore Full Catalog ({servicesMeta.total})</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>

          {/* Services Grid States */}
          {isServicesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : isServicesError ? (
            <ErrorState
              title="Unable to load marketplace services"
              message="We encountered an issue fetching available home services. Please check your connection and retry."
              onRetry={() => refetchServices()}
            />
          ) : rawServices.length === 0 ? (
            <EmptyState
              icon={<Sparkles className="size-6 text-primary" />}
              title="No services found"
              description="No services are currently published in the catalog. Check back soon!"
              className="border-border bg-muted/20 py-12"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
              {rawServices.map((service: ServiceListItem) => (
                <ServiceCard
                  key={service.id}
                  id={service.id}
                  title={service.name}
                  description={service.description}
                  category={service.category?.name || "General"}
                  price={Number(service.price)}
                  priceType="FIXED"
                  providerName={service.provider?.displayName || "Verified Partner"}
                  durationMinutes={service.durationMinutes}
                  imageUrl={getServiceImage(service)}
                  href={`/services/${service.id}`}
                  onBook={() => router.push(`/services/${service.id}`)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </MarketplaceShell>
  )
}
