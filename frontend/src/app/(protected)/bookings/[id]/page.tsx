"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Tag,
  Globe,
  FileText,
  ExternalLink,
  History,
  CheckCircle2,
  XCircle,
  FileQuestion,
  ShieldAlert,
  BadgeCheck,
  Award,
} from "lucide-react"

import { MarketplaceShell } from "@/components/layout/marketplace-shell"
import { Card } from "@/components/data-display/base-card"
import { StatusBadge } from "@/components/data-display/status-badge"
import { EmptyState } from "@/components/feedback/empty-state"
import { ErrorState } from "@/components/feedback/error-state"
import { Skeleton, SkeletonText } from "@/components/feedback/skeleton"
import { Spinner } from "@/components/feedback/spinner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/overlays/dialog"
import {
  useGetBookingByIdQuery,
  useCancelBookingMutation,
} from "@/features/bookings/bookings.api"
import { showSuccessToast, showErrorToast } from "@/shared/ui/toast-service"
import { cn } from "@/lib/utils"

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
  REJECTED: { label: "Rejected by Provider", status: "destructive" },
  EXPIRED: { label: "Expired", status: "neutral" },
  PROVIDER_UNAVAILABLE: { label: "Provider Unavailable", status: "destructive" },
  REASSIGNMENT_PENDING: { label: "Reassignment Pending", status: "warning" },
  NEW_PROVIDER_ASSIGNED: { label: "New Provider Assigned", status: "primary" },
}

// Standard cancellation reasons supported by customer lifecycle
const CANCELLATION_REASONS = [
  { id: "CUSTOMER_SCHEDULE_CONFLICT", label: "Schedule conflict / Need different time" },
  { id: "CHANGE_OF_PLANS", label: "Change of plans / No longer needed" },
  { id: "BOOKED_BY_MISTAKE", label: "Booked by mistake" },
  { id: "PROVIDER_DELAY", label: "Provider delay or unresponsive" },
  { id: "OTHER", label: "Other reason" },
]

// Helper for formatting time
function formatTimeOnly(isoString: string): string {
  try {
    const d = new Date(isoString)
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  } catch {
    return isoString
  }
}

// Helper for formatting date
function formatDateFriendly(isoString: string): string {
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return isoString
  }
}

// Helper for formatting full datetime for status history
function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString)
    return `${d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })} at ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
  } catch {
    return isoString
  }
}

export default function BookingDetailsPage() {
  const params = useParams()
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id
  const numericId = rawId ? Number(rawId) : NaN
  const isValidId = !isNaN(numericId) && Number.isInteger(numericId) && numericId > 0

  // ---------------------------------------------------------------------------
  // RTK Query Hooks
  // ---------------------------------------------------------------------------
  const {
    data: booking,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetBookingByIdQuery(numericId, {
    skip: !isValidId,
  })

  const [cancelBookingMutation, { isLoading: isCancelling }] = useCancelBookingMutation()

  // Cancellation Modal State
  const [isCancelDialogOpen, setIsCancelDialogOpen] = React.useState(false)
  const [cancelReason, setCancelReason] = React.useState("CUSTOMER_SCHEDULE_CONFLICT")
  const [cancelExplanation, setCancelExplanation] = React.useState("")
  const [cancelModalError, setCancelModalError] = React.useState<string | null>(null)

  // Determine error status codes
  const errorStatus =
    (error as { status?: number | string })?.status ||
    (error as { data?: { statusCode?: number } })?.data?.statusCode

  const isNotFound = isError && (errorStatus === 404 || errorStatus === "404")
  const isForbidden = isError && (errorStatus === 403 || errorStatus === "403")

  // Breadcrumbs navigation
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "My Bookings", href: "/bookings" },
    { label: isValidId ? `Booking #${numericId}` : "Booking Details" },
  ]

  // ---------------------------------------------------------------------------
  // Cancellation Handler
  // ---------------------------------------------------------------------------
  const handleConfirmCancel = async () => {
    if (!booking) return
    setCancelModalError(null)

    const reasonLabel =
      CANCELLATION_REASONS.find((r) => r.id === cancelReason)?.label || cancelReason

    try {
      await cancelBookingMutation({
        id: booking.id,
        data: {
          reason: reasonLabel.slice(0, 50),
          explanation: cancelExplanation.trim() || undefined,
        },
      }).unwrap()

      showSuccessToast("Booking Cancelled", {
        description: `Booking #${booking.id} was successfully cancelled.`,
      })
      setIsCancelDialogOpen(false)
      refetch()
    } catch (err: unknown) {
      const backendMessage =
        (err as { data?: { message?: string | string[] } })?.data?.message
      const errorText = Array.isArray(backendMessage)
        ? backendMessage.join(", ")
        : backendMessage || "Failed to cancel booking. Please try again."

      setCancelModalError(errorText)
      showErrorToast("Cancellation Failed", { description: errorText })
    }
  }

  // =========================================================================
  // State 1: Invalid ID
  // =========================================================================
  if (!isValidId) {
    return (
      <MarketplaceShell currentRole="CUSTOMER" breadcrumbs={breadcrumbs}>
        <div className="py-8">
          <EmptyState
            icon={<AlertCircle className="size-8 text-destructive" />}
            title="Invalid Booking Identifier"
            description="The requested URL contains an invalid or non-numeric booking ID. Please return to your bookings list to select a valid appointment."
            action={
              <Button variant="outline" asChild leftIcon={<ArrowLeft className="size-4" />}>
                <Link href="/bookings">Back to My Bookings</Link>
              </Button>
            }
          />
        </div>
      </MarketplaceShell>
    )
  }

  // =========================================================================
  // State 2: Loading Skeleton
  // =========================================================================
  if (isLoading) {
    return (
      <MarketplaceShell currentRole="CUSTOMER" breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <Skeleton className="h-4 w-32 rounded-md" />

          {/* Header Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-8 w-2/3 max-w-lg rounded-lg" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-32 rounded-full" />
            </div>
          </div>

          {/* Two-Column Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6 space-y-4">
                <Skeleton className="h-6 w-40 rounded-md" />
                <SkeletonText lines={3} />
              </Card>

              <Card className="p-6 space-y-4">
                <Skeleton className="h-6 w-48 rounded-md" />
                <SkeletonText lines={3} />
              </Card>

              <Card className="p-6 space-y-4">
                <Skeleton className="h-6 w-36 rounded-md" />
                <SkeletonText lines={2} />
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="p-6 space-y-4">
                <Skeleton className="h-6 w-28 rounded-md" />
                <Skeleton className="h-8 w-36 rounded-md" />
                <SkeletonText lines={3} />
                <Skeleton className="h-10 w-full rounded-lg" />
              </Card>
            </div>
          </div>
        </div>
      </MarketplaceShell>
    )
  }

  // =========================================================================
  // State 3: Not Found (404)
  // =========================================================================
  if (isNotFound) {
    return (
      <MarketplaceShell currentRole="CUSTOMER" breadcrumbs={breadcrumbs}>
        <div className="py-8">
          <EmptyState
            icon={<FileQuestion className="size-8 text-muted-foreground" />}
            title="Booking Not Found"
            description={`Booking #${numericId} does not exist or may have been removed.`}
            action={
              <Button variant="outline" asChild leftIcon={<ArrowLeft className="size-4" />}>
                <Link href="/bookings">Back to My Bookings</Link>
              </Button>
            }
          />
        </div>
      </MarketplaceShell>
    )
  }

  // =========================================================================
  // State 4: Forbidden (403 - Customer Ownership Enforcement)
  // =========================================================================
  if (isForbidden) {
    return (
      <MarketplaceShell currentRole="CUSTOMER" breadcrumbs={breadcrumbs}>
        <div className="py-8">
          <EmptyState
            icon={<ShieldAlert className="size-8 text-destructive" />}
            title="Access Restricted"
            description={`You are not authorized to view Booking #${numericId}. Customers may only access their own appointments.`}
            action={
              <Button variant="outline" asChild leftIcon={<ArrowLeft className="size-4" />}>
                <Link href="/bookings">Return to My Bookings</Link>
              </Button>
            }
          />
        </div>
      </MarketplaceShell>
    )
  }

  // =========================================================================
  // State 5: Server / Network Error
  // =========================================================================
  if (isError || !booking) {
    const errorMsg =
      (error as { data?: { message?: string | string[] } })?.data?.message ||
      "Could not retrieve booking details. Please verify your connection and try again."

    return (
      <MarketplaceShell currentRole="CUSTOMER" breadcrumbs={breadcrumbs}>
        <div className="py-8">
          <ErrorState
            title="Failed to Load Booking Details"
            message={Array.isArray(errorMsg) ? errorMsg.join(", ") : errorMsg}
            onRetry={() => refetch()}
            retryLabel="Retry Loading Booking"
          />
        </div>
      </MarketplaceShell>
    )
  }

  // Configuration for current status
  const statusCfg = statusBadgeConfig[booking.status] || {
    label: booking.status,
    status: "neutral" as const,
  }

  // Backend cancellation rule: Only PENDING and CONFIRMED bookings may be cancelled
  const isCancellable = booking.status === "PENDING" || booking.status === "CONFIRMED"

  return (
    <MarketplaceShell currentRole="CUSTOMER" breadcrumbs={breadcrumbs}>
      <div className="space-y-8 pb-24 lg:pb-8">
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/bookings"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to My Bookings</span>
          </Link>

          {isFetching ? (
            <span className="text-[11px] text-primary animate-pulse">
              Refreshing booking...
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-foreground bg-muted px-2.5 py-0.5 rounded-full border border-border/60">
                Ref #{booking.id}
              </span>
              <StatusBadge status={statusCfg.status} hasDot>
                {statusCfg.label}
              </StatusBadge>
            </div>
          )}
        </div>

        {/* Booking Title & Provider Header */}
        <div className="space-y-3 border-b border-border/60 pb-6">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {booking.service?.category && (
              <span className="inline-flex items-center gap-1 font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                <Tag className="size-3.5" />
                {booking.service.category.name}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border/60 font-medium">
              <Clock className="size-3.5 text-primary" />
              {booking.serviceDurationMinutes} mins
            </span>
            {booking.createdAt && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground text-[11px]">
                  Booked on {formatDateFriendly(booking.createdAt)}
                </span>
              </>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight">
            {booking.serviceName}
          </h1>

          {booking.provider && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-0.5">
              <span>Delivered by</span>
              <span className="font-semibold text-foreground inline-flex items-center gap-1">
                <BadgeCheck className="size-4 text-primary" />
                {booking.provider.displayName}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="inline-flex items-center gap-1 text-success font-medium">
                <ShieldCheck className="size-3.5" />
                Verified Professional
              </span>
              {booking.provider.timezone && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span>Operating in {booking.provider.timezone}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Main Two-Column Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Visual Status Banner, Schedule, Details, Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cancellation Notice Banner (If Cancelled) */}
            {booking.status === "CANCELLED" && booking.cancellation && (
              <div className="p-5 rounded-2xl bg-destructive/10 border border-destructive/30 space-y-2 text-xs text-destructive shadow-xs">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <XCircle className="size-5 shrink-0" />
                  <span>This booking was cancelled</span>
                </div>
                <p className="text-destructive/90 leading-relaxed">
                  <strong>Reason:</strong> {booking.cancellation.reasonCode}
                  {booking.cancellation.explanation && (
                    <> &mdash; &ldquo;{booking.cancellation.explanation}&rdquo;</>
                  )}
                </p>
                {booking.cancellation.cancelledAt && (
                  <span className="text-[11px] text-destructive/80 block pt-1">
                    Cancelled on {formatDateTime(booking.cancellation.cancelledAt)} by{" "}
                    {booking.cancellation.cancelledBy}
                  </span>
                )}
              </div>
            )}

            {/* Hero Appointment Status Showcase Banner */}
            <div
              className={cn(
                "relative rounded-2xl overflow-hidden border p-6 sm:p-8 shadow-xs",
                booking.status === "CONFIRMED" || booking.status === "COMPLETED"
                  ? "bg-gradient-to-br from-emerald-500/12 via-card to-emerald-500/5 border-emerald-500/30"
                  : booking.status === "IN_PROGRESS"
                  ? "bg-gradient-to-br from-primary/18 via-card to-blue-500/5 border-primary/35"
                  : booking.status === "CANCELLED"
                  ? "bg-gradient-to-br from-destructive/12 via-card to-destructive/5 border-destructive/25"
                  : "bg-gradient-to-br from-amber-500/12 via-card to-amber-500/5 border-amber-500/30"
              )}
            >
              {/* Top Status Gradient Accent Stripe */}
              <div
                className={cn(
                  "absolute top-0 left-0 right-0 h-1.5",
                  booking.status === "CONFIRMED" || booking.status === "COMPLETED"
                    ? "bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600"
                    : booking.status === "IN_PROGRESS"
                    ? "bg-gradient-to-r from-primary via-indigo-500 to-blue-600 animate-pulse"
                    : booking.status === "CANCELLED"
                    ? "bg-gradient-to-r from-rose-400 via-destructive to-rose-600"
                    : "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600"
                )}
              />

              {/* Decorative background ambient glows */}
              <div className="absolute -top-16 -right-16 size-48 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 size-48 rounded-full bg-secondary/30 blur-2xl pointer-events-none" />

              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-card/80 border border-border text-foreground shadow-2xs">
                    <CalendarIcon className="size-3.5 text-primary" />
                    Appointment Details
                  </span>
                  <StatusBadge status={statusCfg.status} hasDot>
                    {statusCfg.label}
                  </StatusBadge>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg sm:text-xl font-bold text-foreground">
                    {booking.status === "CONFIRMED"
                      ? "Appointment Confirmed & Reserved"
                      : booking.status === "IN_PROGRESS"
                      ? "Service Delivery Currently In Progress"
                      : booking.status === "COMPLETED"
                      ? "Service Successfully Completed"
                      : booking.status === "CANCELLED"
                      ? "Appointment Cancelled"
                      : "Booking Request Under Review"}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl">
                    Scheduled for{" "}
                    <strong className="text-foreground">{formatDateFriendly(booking.startAt)}</strong>{" "}
                    from{" "}
                    <strong className="text-foreground">
                      {formatTimeOnly(booking.startAt)} - {formatTimeOnly(booking.endAt)}
                    </strong>
                    .
                  </p>
                </div>

                {/* 4 Feature Badges inside banner */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-card/85 border border-border/70 shadow-2xs">
                    <CheckCircle2 className="size-4 text-success shrink-0" />
                    <span className="text-[11px] font-semibold text-foreground">Verified Pro</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-card/85 border border-border/70 shadow-2xs">
                    <Clock className="size-4 text-primary shrink-0" />
                    <span className="text-[11px] font-semibold text-foreground">{booking.serviceDurationMinutes} Mins</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-card/85 border border-border/70 shadow-2xs">
                    <MapPin className="size-4 text-primary shrink-0" />
                    <span className="text-[11px] font-semibold text-foreground">Address Locked</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-card/85 border border-border/70 shadow-2xs">
                    <Award className="size-4 text-success shrink-0" />
                    <span className="text-[11px] font-semibold text-foreground">Guarantee Covered</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 1. Appointment Schedule Card */}
            <Card className="p-6 space-y-4 bg-card border-border shadow-2xs">
              <div className="border-b border-border pb-3">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <CalendarIcon className="size-4 text-primary" />
                  Appointment Schedule & Timing
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-muted/40 border border-border/80 space-y-1">
                  <span className="font-semibold text-muted-foreground block text-[11px] uppercase tracking-wider">
                    Scheduled Date
                  </span>
                  <span className="text-base font-bold text-foreground block">
                    {formatDateFriendly(booking.startAt)}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-muted/40 border border-border/80 space-y-1">
                  <span className="font-semibold text-muted-foreground block text-[11px] uppercase tracking-wider">
                    Time Window
                  </span>
                  <span className="text-base font-bold text-primary block">
                    {formatTimeOnly(booking.startAt)} - {formatTimeOnly(booking.endAt)}
                  </span>
                  <span className="text-[11px] text-muted-foreground block pt-0.5">
                    Estimated duration: {booking.serviceDurationMinutes} minutes
                  </span>
                </div>
              </div>

              {booking.provider?.timezone && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                  <Globe className="size-3.5 text-primary" />
                  <span>Provider operating timezone: <strong className="text-foreground">{booking.provider.timezone}</strong></span>
                </div>
              )}
            </Card>

            {/* 2. Service & Provider Card */}
            <Card className="p-6 space-y-4 bg-card border-border shadow-2xs">
              <div className="border-b border-border pb-3 flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Tag className="size-4 text-primary" />
                  Service & Assigned Professional
                </h2>

                {booking.serviceId && (
                  <Button variant="ghost" size="sm" asChild className="text-xs">
                    <Link
                      href={`/services/${booking.serviceId}`}
                      className="inline-flex items-center gap-1 text-primary hover:text-primary/80"
                    >
                      <span>View Service Listing</span>
                      <ExternalLink className="size-3" />
                    </Link>
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Service Info */}
                <div className="p-4 rounded-xl bg-muted/40 border border-border/80 space-y-2">
                  <span className="text-muted-foreground block text-[11px] uppercase tracking-wider font-semibold">
                    Service Catalog Item
                  </span>
                  <span className="text-sm font-bold text-foreground block">
                    {booking.serviceName}
                  </span>
                  {booking.service?.category && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-card px-2.5 py-0.5 rounded-full border border-border text-foreground shadow-2xs">
                      {booking.service.category.name}
                    </span>
                  )}
                </div>

                {/* Provider Info */}
                <div className="p-4 rounded-xl bg-muted/40 border border-border/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground block text-[11px] uppercase tracking-wider font-semibold">
                      Assigned Provider
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/20">
                      <ShieldCheck className="size-3" /> Verified Pro
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20">
                      {booking.provider?.displayName?.charAt(0).toUpperCase() || "P"}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-foreground text-sm truncate block">
                        {booking.provider?.displayName || "Verified Professional"}
                      </span>
                      {booking.provider?.timezone && (
                        <span className="text-[11px] text-muted-foreground block">
                          Timezone: {booking.provider.timezone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* 3. Delivery Location Card */}
            <Card className="p-6 space-y-4 bg-card border-border shadow-2xs">
              <div className="border-b border-border pb-3">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <MapPin className="size-4 text-primary" />
                  Service Delivery Location
                </h2>
              </div>

              {booking.location ? (
                <div className="p-4 rounded-xl bg-muted/40 border border-border/80 text-xs space-y-1.5">
                  {booking.location.label && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-[11px] border border-primary/20">
                      {booking.location.label}
                    </span>
                  )}
                  <p className="text-foreground font-semibold text-sm leading-relaxed">
                    {booking.location.address}
                  </p>
                  <p className="text-muted-foreground">
                    {booking.location.area}, {booking.location.city} &mdash; PIN: {booking.location.pinCode}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  No delivery address was specified for this booking.
                </p>
              )}
            </Card>

            {/* 4. Special Instructions & Notes */}
            {(booking.customerNote || booking.providerNote) && (
              <Card className="p-6 space-y-4 bg-card border-border shadow-2xs">
                <div className="border-b border-border pb-3">
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                    <FileText className="size-4 text-primary" />
                    Appointment Notes & Instructions
                  </h2>
                </div>

                <div className="space-y-3 text-xs">
                  {booking.customerNote && (
                    <div className="space-y-1">
                      <span className="font-semibold text-foreground block">
                        Customer Instructions:
                      </span>
                      <p className="text-muted-foreground bg-muted/40 p-3.5 rounded-xl border border-border italic leading-relaxed">
                        &ldquo;{booking.customerNote}&rdquo;
                      </p>
                    </div>
                  )}

                  {booking.providerNote && (
                    <div className="space-y-1">
                      <span className="font-semibold text-foreground block">
                        Provider Arrival Note:
                      </span>
                      <p className="text-foreground bg-muted/40 p-3.5 rounded-xl border border-border leading-relaxed">
                        {booking.providerNote}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* 5. Booking Status History Timeline */}
            {booking.statusHistory && booking.statusHistory.length > 0 && (
              <Card className="p-6 space-y-4 bg-card border-border shadow-2xs">
                <div className="border-b border-border pb-3">
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                    <History className="size-4 text-primary" />
                    Status Activity History
                  </h2>
                </div>

                <div className="relative pl-6 space-y-4 border-l-2 border-border/80 ml-2 text-xs">
                  {booking.statusHistory.map((item, idx) => {
                    const itemStatusCfg = statusBadgeConfig[item.toStatus] || {
                      label: item.toStatus,
                      status: "neutral" as const,
                    }

                    return (
                      <div key={item.id || idx} className="relative group">
                        {/* Timeline Bullet */}
                        <span className="absolute -left-[31px] top-1 size-3 rounded-full bg-primary ring-4 ring-card" />

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge status={itemStatusCfg.status} size="sm" hasDot>
                              {itemStatusCfg.label}
                            </StatusBadge>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {formatDateTime(item.createdAt)}
                            </span>
                          </div>

                          {item.reason && (
                            <p className="text-muted-foreground text-[11px]">
                              {item.reason}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}
          </div>

          {/* Right Column: Sticky Summary & Action Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              <Card className="p-6 space-y-5 bg-card border-border shadow-lg rounded-2xl relative overflow-hidden">
                {/* Top decorative accent bar */}
                <div
                  className={cn(
                    "absolute top-0 left-0 right-0 h-1.5",
                    booking.status === "CONFIRMED" || booking.status === "COMPLETED"
                      ? "bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600"
                      : booking.status === "IN_PROGRESS"
                      ? "bg-gradient-to-r from-primary via-indigo-500 to-blue-600 animate-pulse"
                      : booking.status === "CANCELLED"
                      ? "bg-gradient-to-r from-rose-400 via-destructive to-rose-600"
                      : "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600"
                  )}
                />

                {/* Financial Snapshot */}
                <div className="space-y-1.5 border-b border-border pb-4 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Order Summary
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/20">
                      <CheckCircle2 className="size-3" />
                      Transparent Rate
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-black text-foreground tracking-tight">
                      ${booking.finalAmount.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      USD (fixed rate)
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground pt-2">
                    <div className="flex justify-between">
                      <span>Base Service Price:</span>
                      <span className="font-semibold text-foreground">
                        ${booking.servicePrice.toFixed(2)}
                      </span>
                    </div>

                    {booking.discountAmount > 0 && (
                      <div className="flex justify-between text-success font-medium">
                        <span>Discount Applied:</span>
                        <span>-${booking.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Key Guarantees & Features */}
                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-3 text-foreground/90">
                    <Clock className="size-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block text-foreground">
                        {booking.serviceDurationMinutes} mins duration
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Dedicated professional service delivery
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-foreground/90">
                    <ShieldCheck className="size-4 text-success shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block text-foreground">
                        Verified Marketplace Provider
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {booking.provider?.displayName || "Approved Specialist"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-foreground/90">
                    <CheckCircle2 className="size-4 text-success shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block text-foreground">
                        Satisfaction Guarantee
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Protected by ServiceHub quality commitment
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2.5 pt-2 border-t border-border">
                  {/* Cancel Booking Action (Only for PENDING or CONFIRMED bookings) */}
                  {isCancellable && (
                    <Button
                      variant="outline"
                      size="default"
                      fullWidth
                      onClick={() => {
                        setCancelReason("CUSTOMER_SCHEDULE_CONFLICT")
                        setCancelExplanation("")
                        setCancelModalError(null)
                        setIsCancelDialogOpen(true)
                      }}
                      className="text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                    >
                      Cancel Booking
                    </Button>
                  )}

                  <Button
                    variant="primary"
                    size="default"
                    fullWidth
                    asChild
                    className="font-bold shadow-md shadow-primary/20"
                  >
                    <Link href="/services">
                      Browse Other Services
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    size="default"
                    fullWidth
                    asChild
                  >
                    <Link href="/bookings">
                      Back to All Bookings
                    </Link>
                  </Button>
                </div>

                {/* Trust Footer */}
                <div className="pt-3 border-t border-border flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                  <ShieldCheck className="size-3.5 text-success" />
                  <span>24/7 ServiceHub customer assistance</span>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Booking Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border p-3.5 shadow-lg flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-muted-foreground uppercase font-medium block">
              Total Amount
            </span>
            <span className="text-xl font-bold text-foreground">
              ${booking.finalAmount.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isCancellable && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCancelReason("CUSTOMER_SCHEDULE_CONFLICT")
                  setCancelExplanation("")
                  setCancelModalError(null)
                  setIsCancelDialogOpen(true)
                }}
                className="text-xs text-destructive border-destructive/30"
              >
                Cancel
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              asChild
              className="text-xs font-bold"
            >
              <Link href="/services">Browse</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* Cancellation Confirmation Dialog */}
      {/* =================================================================== */}
      <Dialog
        open={isCancelDialogOpen}
        onOpenChange={(open) => {
          if (!open && !isCancelling) {
            setIsCancelDialogOpen(false)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="gap-2">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
              <AlertTriangle className="size-6" />
            </div>
            <div>
              <DialogTitle>Cancel Booking #{booking.id}</DialogTitle>
              <DialogDescription className="mt-1 text-xs">
                Are you sure you want to cancel your appointment for{" "}
                <strong>{booking.serviceName}</strong>?
              </DialogDescription>
            </div>
          </DialogHeader>

          {/* Booking Summary */}
          <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Scheduled Time:</span>
              <span className="font-semibold text-foreground">
                {formatDateFriendly(booking.startAt)} • {formatTimeOnly(booking.startAt)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Provider:</span>
              <span className="text-foreground">{booking.provider?.displayName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-bold text-foreground">
                ${booking.finalAmount.toFixed(2)} USD
              </span>
            </div>
          </div>

          {/* Cancellation Error Alert */}
          {cancelModalError && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{cancelModalError}</span>
            </div>
          )}

          {/* Cancellation Reason Inputs */}
          <div className="space-y-3 py-1">
            <div>
              <label
                htmlFor="detail-cancel-reason"
                className="text-xs font-medium text-foreground block mb-1"
              >
                Reason for Cancellation <span className="text-destructive">*</span>
              </label>
              <select
                id="detail-cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isCancelling}
              >
                {CANCELLATION_REASONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="detail-cancel-explanation"
                className="text-xs font-medium text-foreground block mb-1"
              >
                Additional Details (Optional)
              </label>
              <Textarea
                id="detail-cancel-explanation"
                rows={2}
                maxLength={500}
                showCount
                placeholder="Provide additional context for why you are cancelling..."
                value={cancelExplanation}
                onChange={(e) => setCancelExplanation(e.target.value)}
                disabled={isCancelling}
              />
            </div>

            <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-[11px] text-destructive leading-relaxed">
              Warning: Once cancelled, your appointment will be permanently released and cannot be un-cancelled.
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="default"
              onClick={() => setIsCancelDialogOpen(false)}
              disabled={isCancelling}
            >
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              size="default"
              onClick={handleConfirmCancel}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner size="sm" /> Cancelling...
                </span>
              ) : (
                "Confirm Cancellation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MarketplaceShell>
  )
}
