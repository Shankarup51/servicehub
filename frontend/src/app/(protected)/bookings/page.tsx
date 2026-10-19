"use client"

import * as React from "react"
import Link from "next/link"
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Search,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Plus,
  ChevronDown,
  ChevronUp,
  FileText,
  User,
  ShieldCheck,
  Tag,
  ExternalLink,
} from "lucide-react"

import { MarketplaceShell, type ActiveFilter } from "@/components/layout/marketplace-shell"
import { Card } from "@/components/data-display/base-card"
import { StatusBadge } from "@/components/data-display/status-badge"
import { Pagination } from "@/components/data-display/pagination"
import { EmptyState } from "@/components/feedback/empty-state"
import { ErrorState } from "@/components/feedback/error-state"
import { Skeleton } from "@/components/feedback/skeleton"
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
  useGetMyBookingsQuery,
  useCancelBookingMutation,
} from "@/features/bookings/bookings.api"
import type { BookingItem } from "@/features/bookings/bookings.types"
import { showSuccessToast, showErrorToast } from "@/shared/ui/toast-service"
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
  REJECTED: { label: "Rejected by Provider", status: "destructive" },
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

// Available status filter options
const STATUS_OPTIONS = [
  { label: "All Statuses", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
]

// Server-side sorting options for bookings
const BOOKING_SORT_OPTIONS = [
  { label: "Booked: Newest First", value: "newest" },
  { label: "Booked: Oldest First", value: "oldest" },
  { label: "Scheduled: Earliest First", value: "scheduled-asc" },
  { label: "Scheduled: Latest First", value: "scheduled-desc" },
  { label: "Amount: High to Low", value: "amount-desc" },
  { label: "Amount: Low to High", value: "amount-asc" },
]

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

export default function CustomerBookingsPage() {
  // ---------------------------------------------------------------------------
  // 1. Filter, Sort, and Pagination State
  // ---------------------------------------------------------------------------
  const [selectedStatus, setSelectedStatus] = React.useState<string>("ALL")
  const [timeframe, setTimeframe] = React.useState<"ALL" | "UPCOMING" | "PAST">("ALL")
  const [searchInput, setSearchInput] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [sortOption, setSortOption] = React.useState("newest")
  const [page, setPage] = React.useState(1)

  // Expandable details state per booking ID
  const [expandedBookingIds, setExpandedBookingIds] = React.useState<Record<number, boolean>>({})

  // Cancellation Modal State
  const [bookingToCancel, setBookingToCancel] = React.useState<BookingItem | null>(null)
  const [cancelReason, setCancelReason] = React.useState("CUSTOMER_SCHEDULE_CONFLICT")
  const [cancelExplanation, setCancelExplanation] = React.useState("")
  const [cancelModalError, setCancelModalError] = React.useState<string | null>(null)

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

  // Derive server-side sortBy and sortOrder from sortOption
  const { sortBy, sortOrder } = React.useMemo<{
    sortBy?: "createdAt" | "startAt" | "finalAmount" | "serviceName"
    sortOrder?: "asc" | "desc"
  }>(() => {
    switch (sortOption) {
      case "oldest":
        return { sortBy: "createdAt", sortOrder: "asc" }
      case "scheduled-asc":
        return { sortBy: "startAt", sortOrder: "asc" }
      case "scheduled-desc":
        return { sortBy: "startAt", sortOrder: "desc" }
      case "amount-desc":
        return { sortBy: "finalAmount", sortOrder: "desc" }
      case "amount-asc":
        return { sortBy: "finalAmount", sortOrder: "asc" }
      case "newest":
      default:
        return { sortBy: "createdAt", sortOrder: "desc" }
    }
  }, [sortOption])

  // ---------------------------------------------------------------------------
  // 2. RTK Query Hooks with Server-Side Search, Filter, Sort, and Pagination
  // ---------------------------------------------------------------------------
  const statusParam = selectedStatus !== "ALL" ? selectedStatus : undefined

  const {
    data: bookingsResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetMyBookingsQuery({
    page,
    limit: ITEMS_PER_PAGE,
    status: statusParam,
    timeframe: timeframe !== "ALL" ? timeframe : undefined,
    search: debouncedSearch || undefined,
    sortBy,
    sortOrder,
  })

  const [cancelBookingMutation, { isLoading: isCancelling }] = useCancelBookingMutation()

  const totalItems = bookingsResponse?.total || 0
  const totalPages = bookingsResponse?.totalPages || 1

  // Authoritative server-side booking items directly consumed from PostgreSQL API
  const filteredBookings = React.useMemo(() => {
    return bookingsResponse?.items || []
  }, [bookingsResponse?.items])

  // ---------------------------------------------------------------------------
  // 4. Handlers
  // ---------------------------------------------------------------------------
  const handleSelectStatus = (status: string) => {
    setSelectedStatus(status)
    setPage(1)
  }

  const handleSelectTimeframe = (tf: "ALL" | "UPCOMING" | "PAST") => {
    setTimeframe(tf)
    setPage(1)
  }

  const handleClearAllFilters = () => {
    setSelectedStatus("ALL")
    setTimeframe("ALL")
    setSearchInput("")
    setSortOption("newest")
    setPage(1)
  }

  const toggleExpand = (id: number) => {
    setExpandedBookingIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handleOpenCancelDialog = (booking: BookingItem) => {
    setBookingToCancel(booking)
    setCancelReason("CUSTOMER_SCHEDULE_CONFLICT")
    setCancelExplanation("")
    setCancelModalError(null)
  }

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return

    setCancelModalError(null)
    const reasonLabel =
      CANCELLATION_REASONS.find((r) => r.id === cancelReason)?.label || cancelReason

    try {
      await cancelBookingMutation({
        id: bookingToCancel.id,
        data: {
          reason: reasonLabel.slice(0, 50),
          explanation: cancelExplanation.trim() || undefined,
        },
      }).unwrap()

      showSuccessToast("Booking Cancelled", {
        description: `Booking #${bookingToCancel.id} was successfully cancelled.`,
      })
      setBookingToCancel(null)
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

  // Active filter chips for MarketplaceShell
  const activeFilters: ActiveFilter[] = React.useMemo(() => {
    const list: ActiveFilter[] = []

    if (selectedStatus !== "ALL") {
      const opt = STATUS_OPTIONS.find((s) => s.value === selectedStatus)
      list.push({
        id: "status",
        label: `Status: ${opt?.label || selectedStatus}`,
        onRemove: () => {
          setSelectedStatus("ALL")
          setPage(1)
        },
      })
    }

    if (timeframe !== "ALL") {
      list.push({
        id: "timeframe",
        label: `View: ${timeframe === "UPCOMING" ? "Upcoming" : "Past"}`,
        onRemove: () => {
          setTimeframe("ALL")
          setPage(1)
        },
      })
    }

    if (debouncedSearch) {
      list.push({
        id: "search",
        label: `Search: "${debouncedSearch}"`,
        onRemove: () => {
          setSearchInput("")
          setPage(1)
        },
      })
    }

    return list
  }, [selectedStatus, timeframe, debouncedSearch])

  return (
    <MarketplaceShell
      currentRole="CUSTOMER"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "My Bookings" },
      ]}
      heading="My Bookings"
      subheading="View your scheduled services, track appointment status, and manage appointments"
      searchQuery={searchInput}
      onSearchChange={setSearchInput}
      searchPlaceholder="Search bookings by service, pro, or reference ID..."
      sortOption={sortOption}
      onSortChange={(val) => {
        setSortOption(val)
        setPage(1)
      }}
      sortOptions={BOOKING_SORT_OPTIONS}
      activeFilters={activeFilters}
      onClearAllFilters={handleClearAllFilters}
    >
      <div className="space-y-6">
        {/* Top Control Bar: Timeframe Tabs + Status Pills + Book Service CTA */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
          {/* Timeframe Filter Tabs */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border/80 text-xs">
            {(["ALL", "UPCOMING", "PAST"] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => handleSelectTimeframe(tf)}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary",
                  timeframe === tf
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {tf === "ALL" ? "All Bookings" : tf === "UPCOMING" ? "Upcoming" : "Past / Completed"}
              </button>
            ))}
          </div>

          {/* New Booking CTA */}
          <Button variant="primary" size="sm" asChild leftIcon={<Plus className="size-4" />}>
            <Link href="/services">Book a Service</Link>
          </Button>
        </div>

        {/* Status Filter Horizontal Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-muted-foreground font-semibold text-[11px] uppercase tracking-wider mr-1 shrink-0">
            Status:
          </span>
          {STATUS_OPTIONS.map((opt) => {
            const isSelected = selectedStatus === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelectStatus(opt.value)}
                className={cn(
                  "px-2.5 py-1 rounded-lg border text-xs font-medium whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-primary",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                    : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {opt.label}
              </button>
            )
          })}
        </div>

        {/* Results Counter & Live Indicator */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div>
            {isLoading ? (
              <span>Loading customer bookings...</span>
            ) : (
              <span>
                Showing{" "}
                <strong className="font-semibold text-foreground">
                  {filteredBookings.length}
                </strong>{" "}
                {filteredBookings.length === 1 ? "booking" : "bookings"}
                {totalItems > filteredBookings.length && ` (of ${totalItems} total)`}
              </span>
            )}
          </div>

          {isFetching && !isLoading && (
            <span className="text-[11px] text-primary animate-pulse">
              Syncing bookings...
            </span>
          )}
        </div>

        {/* =================================================================== */}
        {/* State 1: Loading Skeleton Grid */}
        {/* =================================================================== */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-6 space-y-4 bg-card">
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-6 w-32 rounded-full" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48 rounded-md" />
                    <Skeleton className="h-4 w-36 rounded-md" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40 rounded-md" />
                    <Skeleton className="h-4 w-32 rounded-md" />
                  </div>
                  <div className="flex justify-end items-center gap-2">
                    <Skeleton className="h-8 w-24 rounded-lg" />
                    <Skeleton className="h-8 w-24 rounded-lg" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* =================================================================== */}
        {/* State 2: Error State */}
        {/* =================================================================== */}
        {!isLoading && isError && (
          <ErrorState
            title="Failed to Load Bookings"
            message={
              (error as { data?: { message?: string } })?.data?.message ||
              "Could not retrieve your bookings from ServiceHub. Please check your network connection and try again."
            }
            onRetry={() => refetch()}
            retryLabel="Retry Loading Bookings"
          />
        )}

        {/* =================================================================== */}
        {/* State 3: Empty State (Zero bookings ever) */}
        {/* =================================================================== */}
        {!isLoading && !isError && totalItems === 0 && activeFilters.length === 0 && (
          <EmptyState
            icon={<CalendarIcon className="size-8 text-primary" />}
            title="No Bookings Yet"
            description="You haven't scheduled any services yet. Explore our verified professionals to book your first home, maintenance, or cleaning service."
            action={
              <Button variant="primary" asChild leftIcon={<Sparkles className="size-4" />}>
                <Link href="/services">Explore Services Catalog</Link>
              </Button>
            }
          />
        )}

        {/* =================================================================== */}
        {/* State 4: Empty Filtered Results State */}
        {/* =================================================================== */}
        {!isLoading && !isError && filteredBookings.length === 0 && (totalItems > 0 || activeFilters.length > 0) && (
          <EmptyState
            icon={<Search className="size-8 text-muted-foreground" />}
            title="No Matching Bookings Found"
            description="We couldn't find any bookings matching your current status filter, timeframe, or search keyword."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAllFilters}
                leftIcon={<RotateCcw className="size-3.5" />}
              >
                Reset All Filters
              </Button>
            }
          />
        )}

        {/* =================================================================== */}
        {/* State 5: Successful Bookings List */}
        {/* =================================================================== */}
        {!isLoading && !isError && filteredBookings.length > 0 && (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const statusCfg = statusBadgeConfig[booking.status] || {
                label: booking.status,
                status: "neutral" as const,
              }
              const isCancellable =
                booking.status === "PENDING" || booking.status === "CONFIRMED"
              const isExpanded = Boolean(expandedBookingIds[booking.id])
              const grad = statusGradients[booking.status] || defaultBookingGradient

              return (
                <Card
                  key={booking.id}
                  className={cn(
                    "p-5 sm:p-6 space-y-4 relative overflow-hidden transition-all duration-200 shadow-2xs hover:shadow-md",
                    grad.card
                  )}
                >
                  {/* Top Gradient Accent Stripe */}
                  <div className={cn("absolute top-0 left-0 right-0 h-1.5", grad.topBar)} />

                  {/* Card Header: Reference ID + Status Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/70">
                    <div className="flex items-center gap-2">
                      <span className={cn("size-2 rounded-full shrink-0", grad.accentDot)} />
                      <Link
                        href={`/bookings/${booking.id}`}
                        className={cn(
                          "text-xs font-mono font-bold px-2.5 py-1 rounded-md transition-colors hover:underline",
                          grad.refBadge
                        )}
                        title="Open full booking details"
                      >
                        #{booking.id}
                      </Link>
                      {booking.createdAt && (
                        <span className="text-[11px] text-muted-foreground">
                          Booked on {formatDateFriendly(booking.createdAt)}
                        </span>
                      )}
                    </div>

                    <StatusBadge status={statusCfg.status} hasDot>
                      {statusCfg.label}
                    </StatusBadge>
                  </div>

                  {/* Main Grid: Service Details, Scheduled Time, Delivery Location, Pricing */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start text-xs">
                    {/* Left: Service & Provider */}
                    <div className="space-y-1.5">
                      <h3 className="text-base font-bold text-foreground">
                        <Link
                          href={`/bookings/${booking.id}`}
                          className="hover:text-primary transition-colors inline-block"
                        >
                          {booking.serviceName}
                        </Link>
                      </h3>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="size-3.5 text-primary shrink-0" />
                        <span>
                          Provider:{" "}
                          <strong className="font-semibold text-foreground">
                            {booking.provider?.displayName || "Verified Professional"}
                          </strong>
                        </span>
                      </div>
                      {booking.service?.category && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Tag className="size-3 text-muted-foreground shrink-0" />
                          <span>{booking.service.category.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Middle: Appointment Date & Location */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-foreground font-medium">
                        <CalendarIcon className="size-3.5 text-primary shrink-0" />
                        <span>{formatDateFriendly(booking.startAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="size-3.5 text-primary shrink-0" />
                        <span>
                          {formatTimeOnly(booking.startAt)} - {formatTimeOnly(booking.endAt)} ({booking.serviceDurationMinutes} mins)
                        </span>
                      </div>
                      {booking.location && (
                        <div className="flex items-start gap-2 text-muted-foreground">
                          <MapPin className="size-3.5 text-primary shrink-0 mt-0.5" />
                          <span className="truncate">
                            {booking.location.address}, {booking.location.city}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right: Price & Quick Action Buttons */}
                    <div className="flex flex-col md:items-end justify-between space-y-3">
                      <div>
                        <span className="text-[11px] text-muted-foreground block md:text-right">
                          Total Amount
                        </span>
                        <span className="text-xl font-extrabold text-foreground md:text-right block">
                          ${booking.finalAmount.toFixed(2)} USD
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Cancel Action (Only for PENDING or CONFIRMED bookings) */}
                        {isCancellable && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenCancelDialog(booking)}
                            className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                          >
                            Cancel
                          </Button>
                        )}

                        {/* Quick View Drawer Toggle */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand(booking.id)}
                          className="text-xs inline-flex items-center gap-1"
                        >
                          <span>{isExpanded ? "Hide Preview" : "Preview"}</span>
                          {isExpanded ? (
                            <ChevronUp className="size-3.5" />
                          ) : (
                            <ChevronDown className="size-3.5" />
                          )}
                        </Button>

                        {/* View Full Booking Details */}
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="text-xs"
                        >
                          <Link href={`/bookings/${booking.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Booking Details Drawer / Accordion */}
                  {isExpanded && (
                    <div className="pt-4 mt-2 border-t border-border/80 space-y-3 bg-muted/20 p-4 rounded-xl text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {/* Full Location Details */}
                        <div className="space-y-1">
                          <span className="font-semibold text-foreground flex items-center gap-1">
                            <MapPin className="size-3.5 text-primary" /> Delivery Address
                          </span>
                          {booking.location ? (
                            <p className="text-muted-foreground leading-relaxed">
                              {booking.location.label && (
                                <strong className="text-foreground block">
                                  [{booking.location.label}]
                                </strong>
                              )}
                              {booking.location.address}
                              <br />
                              {booking.location.area}, {booking.location.city}
                              <br />
                              PIN: {booking.location.pinCode}
                            </p>
                          ) : (
                            <p className="text-muted-foreground italic">No location specified</p>
                          )}
                        </div>

                        {/* Provider Operating Context */}
                        <div className="space-y-1">
                          <span className="font-semibold text-foreground flex items-center gap-1">
                            <ShieldCheck className="size-3.5 text-success" /> Provider Information
                          </span>
                          <p className="text-muted-foreground">
                            Name: <strong className="text-foreground">{booking.provider?.displayName}</strong>
                            <br />
                            Timezone: {booking.provider?.timezone || "UTC"}
                          </p>
                        </div>

                        {/* Financial Snapshot */}
                        <div className="space-y-1">
                          <span className="font-semibold text-foreground">Billing Summary</span>
                          <p className="text-muted-foreground">
                            Base Rate: ${booking.servicePrice.toFixed(2)}
                            <br />
                            Discount: ${booking.discountAmount.toFixed(2)}
                            <br />
                            <strong className="text-foreground">
                              Final Rate: ${booking.finalAmount.toFixed(2)} USD
                            </strong>
                          </p>
                        </div>
                      </div>

                      {/* Customer Note Snippet */}
                      {booking.customerNote && (
                        <div className="pt-2 border-t border-border/60">
                          <span className="font-semibold text-foreground flex items-center gap-1 mb-0.5">
                            <FileText className="size-3.5 text-primary" /> Customer Instructions:
                          </span>
                          <p className="text-muted-foreground italic bg-card p-2.5 rounded-lg border border-border">
                            &ldquo;{booking.customerNote}&rdquo;
                          </p>
                        </div>
                      )}

                      {/* Provider Note Snippet */}
                      {booking.providerNote && (
                        <div className="pt-2 border-t border-border/60">
                          <span className="font-semibold text-foreground flex items-center gap-1 mb-0.5">
                            <FileText className="size-3.5 text-success" /> Provider Note:
                          </span>
                          <p className="text-muted-foreground bg-card p-2.5 rounded-lg border border-border">
                            {booking.providerNote}
                          </p>
                        </div>
                      )}

                      {/* Link to Full Booking Page */}
                      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-muted-foreground">
                          Need status history timeline or full invoice details?
                        </span>
                        <Link
                          href={`/bookings/${booking.id}`}
                          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                        >
                          <span>Open Full Booking Page</span>
                          <ExternalLink className="size-3" />
                        </Link>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pt-6 border-t border-border mt-8">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={ITEMS_PER_PAGE}
                  onPageChange={(newPage) => {
                    setPage(newPage)
                    if (typeof window !== "undefined") {
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* Cancellation Confirmation Dialog */}
        {/* =================================================================== */}
        <Dialog
          open={Boolean(bookingToCancel)}
          onOpenChange={(open) => {
            if (!open && !isCancelling) {
              setBookingToCancel(null)
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="gap-2">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
                <AlertTriangle className="size-6" />
              </div>
              <div>
                <DialogTitle>Cancel Booking #{bookingToCancel?.id}</DialogTitle>
                <DialogDescription className="mt-1 text-xs">
                  Are you sure you want to cancel this appointment for{" "}
                  <strong>{bookingToCancel?.serviceName}</strong>?
                </DialogDescription>
              </div>
            </DialogHeader>

            {/* Booking snapshot summary */}
            {bookingToCancel && (
              <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Scheduled Time:</span>
                  <span className="font-semibold text-foreground">
                    {formatDateFriendly(bookingToCancel.startAt)} • {formatTimeOnly(bookingToCancel.startAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Provider:</span>
                  <span className="text-foreground">{bookingToCancel.provider?.displayName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-bold text-foreground">
                    ${bookingToCancel.finalAmount.toFixed(2)} USD
                  </span>
                </div>
              </div>
            )}

            {/* Cancellation Error Alert */}
            {cancelModalError && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{cancelModalError}</span>
              </div>
            )}

            {/* Cancellation Form */}
            <div className="space-y-3 py-1">
              <div>
                <label
                  htmlFor="cancel-reason"
                  className="text-xs font-medium text-foreground block mb-1"
                >
                  Reason for Cancellation <span className="text-destructive">*</span>
                </label>
                <select
                  id="cancel-reason"
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
                  htmlFor="cancel-explanation"
                  className="text-xs font-medium text-foreground block mb-1"
                >
                  Additional Context (Optional)
                </label>
                <Textarea
                  id="cancel-explanation"
                  rows={2}
                  maxLength={500}
                  showCount
                  placeholder="Provide any details to help the provider understand..."
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
                onClick={() => setBookingToCancel(null)}
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
      </div>
    </MarketplaceShell>
  )
}
