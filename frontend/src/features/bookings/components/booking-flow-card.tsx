"use client"

import * as React from "react"
import Link from "next/link"
import {
  Calendar as CalendarIcon,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Timer,
  MapPin,
  RotateCcw,
  ArrowRight,
  Lock,
  Sparkles,
  Info,
} from "lucide-react"

import { Card, CardTitle } from "@/components/data-display/base-card"
import { StatusBadge } from "@/components/data-display/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { Skeleton } from "@/components/feedback/skeleton"
import { Spinner } from "@/components/feedback/spinner"
import { useGetPublicAvailabilityQuery } from "@/features/availability/availability.api"
import type { TimeSlot } from "@/features/availability/availability.types"
import {
  useCreateBookingHoldMutation,
  useGetActiveBookingHoldQuery,
  useReleaseBookingHoldMutation,
} from "@/features/booking-holds/booking-holds.api"
import type { BookingHoldResponse } from "@/features/booking-holds/booking-holds.types"
import { useCreateBookingMutation } from "@/features/bookings/bookings.api"
import type { BookingItem, CreateBookingLocationRequest } from "@/features/bookings/bookings.types"
import { showSuccessToast, showErrorToast } from "@/shared/ui/toast-service"
import { cn } from "@/lib/utils"

export interface BookingFlowCardProps {
  service: {
    id: number
    name: string
    price: number
    durationMinutes: number
    provider?: {
      id: number
      displayName: string
      timezone: string
    }
  }
  className?: string
  onClose?: () => void
}

// Helper to format ISO timestamp into user-friendly time string (e.g. "10:00 AM")
function formatTimeOnly(isoString: string): string {
  try {
    const d = new Date(isoString)
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  } catch {
    return isoString
  }
}

// Helper to format ISO date string into friendly date (e.g. "Tuesday, Oct 20, 2026")
function formatDateFriendly(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number)
    const d = new Date(year, month - 1, day)
    return d.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  } catch {
    return dateStr
  }
}

import { useCurrentTime } from "@/lib/clock"

export function BookingFlowCard({ service, className, onClose }: BookingFlowCardProps) {
  // ---------------------------------------------------------------------------
  // 1. Date Setup (Today + next 13 days; max 14 days supported by backend)
  // ---------------------------------------------------------------------------
  const todayStr = React.useMemo(() => {
    const now = new Date()
    return now.toISOString().slice(0, 10)
  }, [])

  const maxDateStr = React.useMemo(() => {
    const max = new Date()
    max.setDate(max.getDate() + 13)
    return max.toISOString().slice(0, 10)
  }, [])

  // Upcoming 7 days for quick pill selector
  const quickDates = React.useMemo(() => {
    const dates: Array<{ dateStr: string; label: string; dayName: string }> = []
    const cur = new Date()
    for (let i = 0; i < 7; i++) {
      const d = new Date(cur)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().slice(0, 10)
      const dayName = i === 0 ? "Today" : i === 1 ? "Tmrw" : d.toLocaleDateString([], { weekday: "short" })
      const label = d.toLocaleDateString([], { month: "short", day: "numeric" })
      dates.push({ dateStr, label, dayName })
    }
    return dates
  }, [])

  const [selectedDate, setSelectedDate] = React.useState<string>(todayStr)
  const [selectedSlot, setSelectedSlot] = React.useState<TimeSlot | null>(null)

  // ---------------------------------------------------------------------------
  // 2. Booking Holds & Form State
  // ---------------------------------------------------------------------------
  const [activeHold, setActiveHold] = React.useState<BookingHoldResponse | null>(null)
  const [manualExpired, setManualExpired] = React.useState(false)
  const [holdError, setHoldError] = React.useState<string | null>(null)

  // Booking Confirmation State
  const [confirmedBooking, setConfirmedBooking] = React.useState<BookingItem | null>(null)
  const [bookingError, setBookingError] = React.useState<string | null>(null)

  const [locationForm, setLocationForm] = React.useState<CreateBookingLocationRequest>({
    address: "",
    city: "",
    area: "",
    pinCode: "",
    label: "Home",
  })
  const [customerNote, setCustomerNote] = React.useState("")
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({})

  // Form input change handler with automatic error clearance on typing
  const handleLocationChange = (field: keyof CreateBookingLocationRequest, value: string) => {
    setLocationForm((prev) => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  // ---------------------------------------------------------------------------
  // 3. RTK Query Hooks
  // ---------------------------------------------------------------------------
  // Query 1: Public availability for provider & selected date
  const providerId = service.provider?.id
  const {
    data: availabilityData,
    isLoading: isAvailabilityLoading,
    isFetching: isAvailabilityFetching,
    isError: isAvailabilityError,
    error: availabilityQueryError,
    refetch: refetchAvailability,
  } = useGetPublicAvailabilityQuery(
    {
      providerId: providerId || 0,
      params: {
        date: selectedDate,
        serviceId: service.id,
      },
    },
    {
      skip: !providerId || !selectedDate,
    }
  )

  // Query 2: Check if customer already has an active hold
  const { data: customerActiveHold } = useGetActiveBookingHoldQuery()

  // Mutation 1: Create Booking Hold
  const [createHoldMutation, { isLoading: isCreatingHold }] = useCreateBookingHoldMutation()

  // Mutation 2: Release Booking Hold
  const [releaseHoldMutation, { isLoading: isReleasingHold }] = useReleaseBookingHoldMutation()

  // Mutation 3: Create Booking
  const [createBookingMutation, { isLoading: isCreatingBooking }] = useCreateBookingMutation()

  // Extract slots for selected date
  const availableSlots: TimeSlot[] = React.useMemo(() => {
    if (!availabilityData?.availability || availabilityData.availability.length === 0) {
      return []
    }
    const dayEntry = availabilityData.availability.find((a) => a.date === selectedDate)
    return dayEntry?.slots || []
  }, [availabilityData, selectedDate])

  // ---------------------------------------------------------------------------
  // 4. Live Clock (Subscribed via cached store for React 19 purity)
  // ---------------------------------------------------------------------------
  const nowMs = useCurrentTime()

  // Derive resumed hold if user has one existing in DB for this service
  const resumedHold: BookingHoldResponse | null = React.useMemo(() => {
    if (
      !customerActiveHold ||
      customerActiveHold.serviceId !== service.id ||
      customerActiveHold.status !== "ACTIVE" ||
      confirmedBooking
    ) {
      return null
    }
    const createdMs = new Date(customerActiveHold.createdAt).getTime()
    if (nowMs > 0 && nowMs - createdMs >= 15 * 60 * 1000) {
      return null
    }
    return {
      id: customerActiveHold.id,
      serviceId: customerActiveHold.serviceId,
      serviceName: customerActiveHold.serviceName || service.name,
      providerId: customerActiveHold.providerId,
      providerDisplayName:
        customerActiveHold.providerDisplayName ||
        service.provider?.displayName ||
        "Provider",
      startAt: customerActiveHold.startAt,
      endAt: customerActiveHold.endAt,
      expiresAt: customerActiveHold.expiresAt,
      holdTimeoutMinutes: 15,
      status: "ACTIVE",
      createdAt: customerActiveHold.createdAt,
    }
  }, [customerActiveHold, service, confirmedBooking, nowMs])

  const effectiveHold = activeHold || resumedHold

  const remainingSeconds = React.useMemo(() => {
    if (!effectiveHold || confirmedBooking || nowMs === 0) return null
    const createdTime = new Date(effectiveHold.createdAt).getTime()
    const holdTimeoutMs = (effectiveHold.holdTimeoutMinutes || 15) * 60 * 1000
    const expiryTime = createdTime + holdTimeoutMs
    return Math.max(0, Math.floor((expiryTime - nowMs) / 1000))
  }, [effectiveHold, confirmedBooking, nowMs])

  const isHoldExpired = manualExpired || (remainingSeconds !== null && remainingSeconds <= 0)

  // Format countdown string MM:SS
  const timerDisplay = React.useMemo(() => {
    if (remainingSeconds === null) return "--:--"
    const mins = Math.floor(remainingSeconds / 60)
    const secs = remainingSeconds % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }, [remainingSeconds])

  // Track hold in ref for cleanup
  const activeHoldRef = React.useRef<BookingHoldResponse | null>(null)
  const isConfirmedRef = React.useRef(false)

  React.useEffect(() => {
    activeHoldRef.current = effectiveHold
    isConfirmedRef.current = Boolean(confirmedBooking)
  }, [effectiveHold, confirmedBooking])

  // ---------------------------------------------------------------------------
  // 5. Hold Creation Handler
  // ---------------------------------------------------------------------------
  const handleCreateHold = async () => {
    if (!selectedSlot) return
    setHoldError(null)
    setManualExpired(false)

    try {
      const hold = await createHoldMutation({
        serviceId: service.id,
        startAt: selectedSlot.startAt,
      }).unwrap()

      setActiveHold(hold)
      showSuccessToast("Time slot held for 15 minutes!", {
        description: "Please complete your delivery location to confirm the booking.",
      })
    } catch (err: unknown) {
      const backendMessage =
        (err as { data?: { message?: string | string[] } })?.data?.message
      const errorText = Array.isArray(backendMessage)
        ? backendMessage.join(", ")
        : backendMessage || "Failed to create booking hold. Please choose a different slot."

      setHoldError(errorText)
      showErrorToast("Could not reserve slot", { description: errorText })
      // Refresh availability in case slot was taken by another user
      refetchAvailability()
    }
  }

  // ---------------------------------------------------------------------------
  // 6. Hold Release Handler
  // ---------------------------------------------------------------------------
  const handleReleaseHold = async (showToast = true) => {
    if (!effectiveHold) return

    const holdId = effectiveHold.id
    try {
      await releaseHoldMutation(holdId).unwrap()
      setActiveHold(null)
      setManualExpired(false)
      setSelectedSlot(null)
      setHoldError(null)
      if (showToast) {
        showSuccessToast("Booking hold released", {
          description: "You may now select another date or time slot.",
        })
      }
      refetchAvailability()
    } catch (err: unknown) {
      // Even if release network failed, reset local hold if it was expired
      if (isHoldExpired) {
        setActiveHold(null)
        setManualExpired(false)
        setSelectedSlot(null)
      } else {
        const backendMessage = (err as { data?: { message?: string } })?.data?.message
        setHoldError(backendMessage || "Failed to release booking hold.")
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 7. Location Form Validation & Booking Confirmation Handler
  // ---------------------------------------------------------------------------
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!locationForm.address.trim()) {
      errors.address = "Street address is required"
    }
    if (!locationForm.city.trim()) {
      errors.city = "City is required"
    }
    if (!locationForm.area.trim()) {
      errors.area = "Area or neighborhood is required"
    }
    if (!locationForm.pinCode.trim()) {
      errors.pinCode = "Postal / PIN code is required"
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!effectiveHold) return

    if (isHoldExpired || (remainingSeconds !== null && remainingSeconds <= 0)) {
      setBookingError("Your booking hold has expired. Please select a new slot.")
      return
    }

    if (!validateForm()) {
      return
    }

    setBookingError(null)

    try {
      const booking = await createBookingMutation({
        bookingHoldId: effectiveHold.id,
        customerNote: customerNote.trim() ? customerNote.trim() : undefined,
        location: {
          address: locationForm.address.trim(),
          city: locationForm.city.trim(),
          area: locationForm.area.trim(),
          pinCode: locationForm.pinCode.trim(),
          label: locationForm.label?.trim() || undefined,
        },
      }).unwrap()

      setConfirmedBooking(booking)
      setActiveHold(null)
      showSuccessToast("Booking Confirmed Successfully!", {
        description: `Booking #${booking.id} has been registered with the provider.`,
      })
    } catch (err: unknown) {
      const backendMessage =
        (err as { data?: { message?: string | string[] } })?.data?.message
      const errorText = Array.isArray(backendMessage)
        ? backendMessage.join(", ")
        : backendMessage || "Failed to confirm booking. Please review details and try again."

      setBookingError(errorText)
      showErrorToast("Booking Confirmation Failed", { description: errorText })

      // If backend reports hold is expired, mark it expired
      if (
        typeof errorText === "string" &&
        errorText.toLowerCase().includes("expired")
      ) {
        setManualExpired(true)
      }
    }
  }

  // ---------------------------------------------------------------------------
  // View 1: Confirmed Booking Success State
  // ---------------------------------------------------------------------------
  if (confirmedBooking) {
    return (
      <Card className={cn("p-6 space-y-5 bg-card border-success/30 shadow-md", className)}>
        <div className="flex items-center gap-3 pb-3 border-b border-border pr-6">
          <div className="size-10 rounded-full bg-success/15 text-success flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-success uppercase tracking-wider block">
              Booking Confirmed
            </span>
            <CardTitle className="text-lg font-bold text-foreground">
              Reference #{confirmedBooking.id}
            </CardTitle>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Order Status</span>
          <StatusBadge status="warning" hasDot>
            {confirmedBooking.status} (Awaiting Provider Confirmation)
          </StatusBadge>
        </div>

        {/* Booking Details Summary */}
        <div className="space-y-3 p-3.5 rounded-xl bg-muted/40 border border-border text-xs">
          <div className="flex items-start gap-2">
            <CalendarIcon className="size-3.5 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-foreground block">
                Scheduled Slot
              </span>
              <span className="text-muted-foreground">
                {formatDateFriendly(new Date(confirmedBooking.startAt).toISOString().slice(0, 10))} •{" "}
                {formatTimeOnly(confirmedBooking.startAt)} - {formatTimeOnly(confirmedBooking.endAt)}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="size-3.5 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-foreground block">
                Delivery Location
              </span>
              <span className="text-muted-foreground">
                {confirmedBooking.location?.address}, {confirmedBooking.location?.area},{" "}
                {confirmedBooking.location?.city} - {confirmedBooking.location?.pinCode}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <ShieldCheck className="size-3.5 text-success shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-foreground block">
                Assigned Provider
              </span>
              <span className="text-muted-foreground">
                {service.provider?.displayName || "Verified Professional"}
              </span>
            </div>
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-xs font-medium text-muted-foreground">
            Total Amount (Fixed Rate)
          </span>
          <span className="text-xl font-extrabold text-foreground">
            ${confirmedBooking.finalAmount.toFixed(2)} USD
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <Button
            variant="primary"
            size="default"
            fullWidth
            asChild
            rightIcon={<ArrowRight className="size-4" />}
          >
            <Link href={`/bookings/${confirmedBooking.id}`}>View Booking Details</Link>
          </Button>

          <Button
            variant="outline"
            size="default"
            fullWidth
            asChild
          >
            <Link href="/bookings">Go to All Bookings</Link>
          </Button>

          <Button
            variant="ghost"
            size="default"
            fullWidth
            onClick={() => {
              setConfirmedBooking(null)
              setSelectedSlot(null)
              setSelectedDate(todayStr)
            }}
          >
            Book Another Appointment
          </Button>

          {onClose && (
            <Button
              variant="secondary"
              size="default"
              fullWidth
              onClick={onClose}
            >
              Close Window
            </Button>
          )}
        </div>
      </Card>
    )
  }

  // ---------------------------------------------------------------------------
  // View 2: Active Booking Hold (15-min reservation & delivery address form)
  // ---------------------------------------------------------------------------
  if (effectiveHold) {
    const isTimerUrgent = remainingSeconds !== null && remainingSeconds <= 180

    return (
      <Card className={cn("p-6 space-y-5 bg-card border-primary/40 shadow-md", className)}>
        {/* Hold Active Header with Countdown */}
        <div className="space-y-2 border-b border-border pb-4 pr-6">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
              <Lock className="size-3.5" />
              Slot Reserved
            </span>

            <div
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-bold font-mono px-2.5 py-1 rounded-full border",
                isHoldExpired
                  ? "bg-destructive/15 text-destructive border-destructive/30"
                  : isTimerUrgent
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 animate-pulse"
                  : "bg-primary/15 text-primary border-primary/30"
              )}
            >
              <Timer className="size-3.5" />
              <span>{isHoldExpired ? "Hold Expired" : `${timerDisplay} left`}</span>
            </div>
          </div>

          <div>
            <CardTitle className="text-base font-bold text-foreground">
              Complete Your Booking
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              This slot is temporarily locked for you. Submit your delivery location before the timer expires.
            </p>
          </div>
        </div>

        {/* Selected Slot Summary Card */}
        <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">
              {formatDateFriendly(new Date(effectiveHold.startAt).toISOString().slice(0, 10))}
            </span>
            <span className="font-bold text-primary">
              {formatTimeOnly(effectiveHold.startAt)} - {formatTimeOnly(effectiveHold.endAt)}
            </span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground text-[11px]">
            <span>Provider: {effectiveHold.providerDisplayName}</span>
            <span>Duration: {service.durationMinutes} mins</span>
          </div>
        </div>

        {/* Expired Hold Notice */}
        {isHoldExpired && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Your 15-minute hold has expired</p>
              <p className="text-[11px] leading-relaxed">
                Slots are released automatically to remain fair to all customers. Please release this hold to select a new appointment slot.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleReleaseHold(false)}
                className="mt-1 text-xs"
                disabled={isReleasingHold}
              >
                Choose Another Slot
              </Button>
            </div>
          </div>
        )}

        {/* Booking Error Banner */}
        {bookingError && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{bookingError}</span>
          </div>
        )}

        {/* Delivery Location & Confirmation Form */}
        <form onSubmit={handleConfirmBooking} className="space-y-4">
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              Service Delivery Location
            </span>

            {/* Street Address */}
            <div>
              <label
                htmlFor="booking-address"
                className="text-xs font-medium text-foreground block mb-1"
              >
                Street Address <span className="text-destructive">*</span>
              </label>
              <Input
                id="booking-address"
                placeholder="e.g. 123 Main St, Apt 4B"
                value={locationForm.address}
                onChange={(e) => handleLocationChange("address", e.target.value)}
                error={formErrors.address}
                disabled={isCreatingBooking || isHoldExpired}
                className="text-foreground text-[#242424] dark:text-[#F5F3F0]"
              />
              {formErrors.address && (
                <span className="text-[11px] text-destructive block mt-1">
                  {formErrors.address}
                </span>
              )}
            </div>

            {/* City & Area Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label
                  htmlFor="booking-city"
                  className="text-xs font-medium text-foreground block mb-1"
                >
                  City <span className="text-destructive">*</span>
                </label>
                <Input
                  id="booking-city"
                  placeholder="e.g. New York"
                  value={locationForm.city}
                  onChange={(e) => handleLocationChange("city", e.target.value)}
                  error={formErrors.city}
                  disabled={isCreatingBooking || isHoldExpired}
                  className="text-foreground text-[#242424] dark:text-[#F5F3F0]"
                />
                {formErrors.city && (
                  <span className="text-[11px] text-destructive block mt-1">
                    {formErrors.city}
                  </span>
                )}
              </div>

              <div>
                <label
                  htmlFor="booking-area"
                  className="text-xs font-medium text-foreground block mb-1"
                >
                  Area / Locality <span className="text-destructive">*</span>
                </label>
                <Input
                  id="booking-area"
                  placeholder="e.g. Manhattan"
                  value={locationForm.area}
                  onChange={(e) => handleLocationChange("area", e.target.value)}
                  error={formErrors.area}
                  disabled={isCreatingBooking || isHoldExpired}
                  className="text-foreground text-[#242424] dark:text-[#F5F3F0]"
                />
                {formErrors.area && (
                  <span className="text-[11px] text-destructive block mt-1">
                    {formErrors.area}
                  </span>
                )}
              </div>
            </div>

            {/* Postal Code & Address Label Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label
                  htmlFor="booking-pincode"
                  className="text-xs font-medium text-foreground block mb-1"
                >
                  Postal / PIN <span className="text-destructive">*</span>
                </label>
                <Input
                  id="booking-pincode"
                  placeholder="e.g. 10001"
                  value={locationForm.pinCode}
                  onChange={(e) => handleLocationChange("pinCode", e.target.value)}
                  error={formErrors.pinCode}
                  disabled={isCreatingBooking || isHoldExpired}
                  className="text-foreground text-[#242424] dark:text-[#F5F3F0]"
                />
                {formErrors.pinCode && (
                  <span className="text-[11px] text-destructive block mt-1">
                    {formErrors.pinCode}
                  </span>
                )}
              </div>

              <div>
                <label
                  htmlFor="booking-label"
                  className="text-xs font-medium text-foreground block mb-1"
                >
                  Label (Optional)
                </label>
                <Input
                  id="booking-label"
                  placeholder="e.g. Home, Office"
                  value={locationForm.label || ""}
                  onChange={(e) => handleLocationChange("label", e.target.value)}
                  disabled={isCreatingBooking || isHoldExpired}
                  className="text-foreground text-[#242424] dark:text-[#F5F3F0]"
                />
              </div>
            </div>

            {/* Customer Special Notes */}
            <div>
              <label
                htmlFor="booking-notes"
                className="text-xs font-medium text-foreground block mb-1"
              >
                Special Instructions (Optional)
              </label>
              <Textarea
                id="booking-notes"
                placeholder="Add special instructions, entry codes, or specific requests for the provider..."
                rows={2}
                maxLength={500}
                showCount
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                disabled={isCreatingBooking || isHoldExpired}
                className="text-foreground text-[#242424] dark:text-[#F5F3F0]"
              />
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="pt-3 border-t border-border flex items-baseline justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Total Amount
            </span>
            <div className="text-right">
              <span className="text-2xl font-extrabold text-foreground">
                ${service.price.toFixed(2)}
              </span>
              <span className="text-[11px] text-muted-foreground block">
                USD fixed rate
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-1">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isCreatingBooking || isHoldExpired}
              className="font-semibold shadow-xs"
            >
              {isCreatingBooking ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner size="sm" />
                  Confirming Booking...
                </span>
              ) : (
                `Confirm & Book Now ($${service.price.toFixed(2)})`
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="default"
              fullWidth
              onClick={() => handleReleaseHold(true)}
              disabled={isReleasingHold || isCreatingBooking}
            >
              {isReleasingHold ? "Releasing Hold..." : "Release Hold & Choose Different Slot"}
            </Button>
          </div>
        </form>
      </Card>
    )
  }

  // ---------------------------------------------------------------------------
  // View 3: Slot Selection & Hold Creation Experience
  // ---------------------------------------------------------------------------
  return (
    <Card className={cn("p-6 space-y-5 bg-card border-border shadow-md", className)}>
      {/* Price Header */}
      <div className="space-y-1 border-b border-border pb-4 pr-6">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Service Price
        </span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-extrabold text-foreground">
            ${service.price.toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground font-medium">
            USD (fixed rate)
          </span>
        </div>
      </div>

      {/* Another Active Hold Alert */}
      {customerActiveHold &&
        customerActiveHold.serviceId !== service.id &&
        customerActiveHold.status === "ACTIVE" && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300">
            <Info className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div className="space-y-1">
              <span className="font-semibold block">
                Active Hold on Another Service
              </span>
              <p className="text-[11px] leading-relaxed">
                You currently have an active reservation hold for another service. Release it before creating a new hold here.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => releaseHoldMutation(customerActiveHold.id)}
                disabled={isReleasingHold}
                className="mt-1 text-xs"
              >
                Release Previous Hold
              </Button>
            </div>
          </div>
        )}

      {/* Hold Creation Error Alert */}
      {holdError && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{holdError}</span>
        </div>
      )}

      {/* Date Selection Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <CalendarIcon className="size-3.5 text-primary" />
            Select Appointment Date
          </label>
        </div>

        {/* Quick Date Pills (Next 7 Days) */}
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
          {quickDates.map((item) => {
            const isSelected = selectedDate === item.dateStr
            return (
              <button
                key={item.dateStr}
                type="button"
                onClick={() => {
                  setSelectedDate(item.dateStr)
                  setSelectedSlot(null)
                  setHoldError(null)
                }}
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-xl text-xs transition-all border text-center focus:outline-none focus:ring-2 focus:ring-primary",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs scale-102"
                    : "bg-card border-border/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                aria-pressed={isSelected}
              >
                <span className="text-[10px] uppercase font-semibold">
                  {item.dayName}
                </span>
                <span className="text-xs font-bold mt-0.5">{item.label}</span>
              </button>
            )
          })}
        </div>

        {/* DatePicker Fallback for Next 14 Days */}
        <div className="pt-1">
          <DatePicker
            value={selectedDate}
            onChange={(dateStr) => {
              if (dateStr) {
                setSelectedDate(dateStr)
                setSelectedSlot(null)
                setHoldError(null)
              }
            }}
            min={todayStr}
            max={maxDateStr}
            placeholder="Choose date from calendar..."
          />
        </div>
      </div>

      {/* Available Slots Section */}
      <div className="space-y-3 pt-2 border-t border-border">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Clock className="size-3.5 text-primary" />
            Available Time Slots
          </label>
          {isAvailabilityFetching && !isAvailabilityLoading && (
            <span className="text-[11px] text-primary animate-pulse">
              Updating slots...
            </span>
          )}
        </div>

        {/* Slots Loading Skeleton */}
        {isAvailabilityLoading && (
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-xl" />
            ))}
          </div>
        )}

        {/* Slots Fetch Error */}
        {!isAvailabilityLoading && isAvailabilityError && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive space-y-2">
            <div className="flex items-center gap-1.5 font-semibold">
              <AlertCircle className="size-4" />
              <span>Could not load availability</span>
            </div>
            <p className="text-[11px] leading-relaxed text-destructive/90">
              {(availabilityQueryError as { data?: { message?: string } })?.data?.message ||
                "Provider availability could not be fetched for this date. The provider may be unverified or have no active schedule."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchAvailability()}
              leftIcon={<RotateCcw className="size-3" />}
              className="text-xs"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Empty Slots State */}
        {!isAvailabilityLoading && !isAvailabilityError && availableSlots.length === 0 && (
          <div className="text-center p-5 rounded-xl border border-dashed border-border bg-muted/20 space-y-2">
            <CalendarIcon className="size-6 text-muted-foreground mx-auto opacity-70" />
            <p className="text-xs font-semibold text-foreground">
              No Slots Available on {formatDateFriendly(selectedDate)}
            </p>
            <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
              The provider has no open booking hours or is fully booked on this day. Please select a different date above.
            </p>
          </div>
        )}

        {/* Slots Grid */}
        {!isAvailabilityLoading && !isAvailabilityError && availableSlots.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
            {availableSlots.map((slot, idx) => {
              const isSelected = selectedSlot?.startAt === slot.startAt
              return (
                <button
                  key={slot.startAt || idx}
                  type="button"
                  onClick={() => {
                    setSelectedSlot(slot)
                    setHoldError(null)
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 px-2.5 rounded-xl text-xs transition-all border focus:outline-none focus:ring-2 focus:ring-primary",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs scale-102"
                      : "bg-card border-border/80 text-foreground hover:border-primary/60 hover:bg-muted"
                  )}
                  aria-pressed={isSelected}
                >
                  <span className="font-semibold">{formatTimeOnly(slot.startAt)}</span>
                  <span
                    className={cn(
                      "text-[10px]",
                      isSelected ? "text-primary-foreground/90" : "text-muted-foreground"
                    )}
                  >
                    to {formatTimeOnly(slot.endAt)}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Selected Slot Information */}
      {selectedSlot && (
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary shrink-0" />
            <div>
              <span className="font-semibold text-foreground block">
                Selected: {formatTimeOnly(selectedSlot.startAt)} - {formatTimeOnly(selectedSlot.endAt)}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {formatDateFriendly(selectedDate)} ({service.durationMinutes} mins)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Hold Slot CTA Action */}
      <div className="space-y-2.5 pt-2">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!selectedSlot || isCreatingHold}
          onClick={handleCreateHold}
          className="font-semibold shadow-xs"
        >
          {isCreatingHold ? (
            <span className="inline-flex items-center gap-2">
              <Spinner size="sm" />
              Holding Slot...
            </span>
          ) : selectedSlot ? (
            "Reserve Slot (15-Min Hold)"
          ) : (
            "Select a Date & Time Slot"
          )}
        </Button>

        <Button
          variant="outline"
          size="default"
          fullWidth
          asChild
        >
          <Link href="/services">
            Browse Other Services
          </Link>
        </Button>
      </div>

      {/* Service Highlights */}
      <div className="space-y-2.5 pt-3 border-t border-border text-xs text-muted-foreground">
        <div className="flex items-center gap-2 text-foreground">
          <Clock className="size-4 text-primary shrink-0" />
          <span>Estimated time: <strong>{service.durationMinutes} minutes</strong></span>
        </div>
        <div className="flex items-center gap-2 text-foreground">
          <ShieldCheck className="size-4 text-success shrink-0" />
          <span>Delivered by an <strong>approved provider</strong></span>
        </div>
        <div className="flex items-center gap-2 text-foreground">
          <CheckCircle2 className="size-4 text-primary shrink-0" />
          <span>Instant reservation lock with 15-minute hold</span>
        </div>
      </div>
    </Card>
  )
}
