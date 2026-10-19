"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  Clock,
  Sparkles,
  ShieldCheck,
  Tag,
  AlertCircle,
  FileQuestion,
  Calendar,
  CheckCircle2,
  Lock,
  Zap,
  Award,
  BadgeCheck,
  Star,
} from "lucide-react"

import { MarketplaceShell } from "@/components/layout/marketplace-shell"
import { Card } from "@/components/data-display/base-card"
import { EmptyState } from "@/components/feedback/empty-state"
import { ErrorState } from "@/components/feedback/error-state"
import { Skeleton, SkeletonText } from "@/components/feedback/skeleton"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/overlays/dialog"
import { useGetServiceByIdQuery } from "@/features/services/services.api"
import { BookingFlowCard } from "@/features/bookings"
import { cn } from "@/lib/utils"

function getCategoryIcon(categoryName?: string) {
  const cat = (categoryName || "").toLowerCase()
  if (cat.includes("electric")) return <Zap className="size-3.5" />
  if (cat.includes("clean")) return <Sparkles className="size-3.5" />
  if (cat.includes("plumb") || cat.includes("repair")) return <Award className="size-3.5" />
  return <Tag className="size-3.5" />
}

export default function ServiceDetailsPage() {
  const params = useParams()
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id
  const numericId = rawId ? Number(rawId) : NaN
  const isValidId = !isNaN(numericId) && Number.isInteger(numericId) && numericId > 0

  const {
    data: service,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetServiceByIdQuery(numericId, {
    skip: !isValidId,
  })

  // Selected thumbnail index for gallery
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0)
  // State for opening/closing the booking flow modal
  const [isBookingModalOpen, setIsBookingModalOpen] = React.useState(false)

  // Identify accessible image URLs (http://, https://, or /)
  const accessibleImages = (service?.images || []).filter(
    (img) =>
      img.storageKey &&
      (img.storageKey.startsWith("http://") ||
        img.storageKey.startsWith("https://") ||
        img.storageKey.startsWith("/"))
  )

  // Determine if error is a 404 Not Found
  const isNotFound = Boolean(
    isError &&
      error &&
      ((error as { status?: number | string }).status === 404 ||
        (error as { data?: { statusCode?: number } }).data?.statusCode === 404)
  )

  // Breadcrumbs
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Services", href: "/services" },
    { label: service ? service.name : isValidId ? `Service #${numericId}` : "Service Details" },
  ]

  // =========================================================================
  // State 1: Invalid ID
  // =========================================================================
  if (!isValidId) {
    return (
      <MarketplaceShell currentRole="CUSTOMER" breadcrumbs={breadcrumbs}>
        <div className="py-8">
          <EmptyState
            icon={<AlertCircle className="size-8 text-destructive" />}
            title="Invalid Service Identifier"
            description="The requested service URL contains an invalid or non-numeric ID. Please return to the services catalog to browse valid listings."
            action={
              <Button variant="outline" asChild leftIcon={<ArrowLeft className="size-4" />}>
                <Link href="/services">Back to Services Catalog</Link>
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
          {/* Back link skeleton */}
          <Skeleton className="h-4 w-32 rounded-md" />

          {/* Header Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-8 w-2/3 max-w-lg rounded-lg" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
          </div>

          {/* Two-column layout skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left 2 cols */}
            <div className="lg:col-span-2 space-y-6">
              {/* Media gallery skeleton */}
              <Skeleton className="h-72 sm:h-96 w-full rounded-2xl" />

              {/* Description card skeleton */}
              <Card className="p-6 space-y-4">
                <Skeleton className="h-6 w-40 rounded-md" />
                <SkeletonText lines={4} />
              </Card>

              {/* Provider card skeleton */}
              <Card className="p-6 space-y-4">
                <Skeleton className="h-6 w-48 rounded-md" />
                <div className="flex items-center gap-3">
                  <Skeleton shape="circle" className="size-12" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-40 rounded-md" />
                    <Skeleton className="h-4 w-28 rounded-md" />
                  </div>
                </div>
                <SkeletonText lines={2} />
              </Card>
            </div>

            {/* Right 1 col (Summary card skeleton) */}
            <div className="lg:col-span-1">
              <Card className="p-6 space-y-5">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-8 w-36 rounded-md" />
                </div>
                <div className="space-y-3 pt-3 border-t border-border">
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-4/5 rounded-md" />
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                </div>
                <Skeleton className="h-11 w-full rounded-lg" />
                <Skeleton className="h-9 w-full rounded-lg" />
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
            title="Service Not Found"
            description={`Service #${numericId} does not exist, has been removed, or is not currently active in the marketplace.`}
            action={
              <Button variant="outline" asChild leftIcon={<ArrowLeft className="size-4" />}>
                <Link href="/services">Browse All Services</Link>
              </Button>
            }
          />
        </div>
      </MarketplaceShell>
    )
  }

  // =========================================================================
  // State 4: Server / Network Error
  // =========================================================================
  if (isError || !service) {
    const errorMsg =
      (error as { data?: { message?: string | string[] } })?.data?.message ||
      "Could not communicate with the ServiceHub catalog. Please check your network connection and try again."

    return (
      <MarketplaceShell currentRole="CUSTOMER" breadcrumbs={breadcrumbs}>
        <div className="py-8">
          <ErrorState
            title="Failed to Load Service Details"
            message={Array.isArray(errorMsg) ? errorMsg.join(", ") : errorMsg}
            onRetry={() => refetch()}
            retryLabel="Retry Loading Service"
          />
        </div>
      </MarketplaceShell>
    )
  }

  // Active cover image (or undefined if no accessible URLs)
  const activeImage =
    accessibleImages.length > 0
      ? accessibleImages[selectedImageIndex]?.storageKey || accessibleImages[0].storageKey
      : undefined

  // Format duration nicely
  const formattedDuration = (() => {
    const mins = service.durationMinutes
    if (!mins || mins <= 0) return null
    if (mins < 60) return `${mins} mins`
    const hrs = Math.floor(mins / 60)
    const remainingMins = mins % 60
    return remainingMins > 0 ? `${hrs}h ${remainingMins}m` : `${hrs} hr${hrs > 1 ? "s" : ""}`
  })()

  // =========================================================================
  // State 5: Success - Service Details View
  // =========================================================================
  return (
    <MarketplaceShell currentRole="CUSTOMER" breadcrumbs={breadcrumbs}>
      <div className="space-y-8 pb-24 lg:pb-8">
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Services Catalog</span>
          </Link>

          {isFetching ? (
            <span className="text-[11px] text-primary animate-pulse">
              Refreshing details...
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success bg-success/10 border border-success/20 px-2.5 py-0.5 rounded-full">
                <span className="size-1.5 rounded-full bg-success animate-pulse" />
                Active Marketplace Listing
              </span>
            </div>
          )}
        </div>

        {/* Service Title & Provider Hero Header */}
        <div className="space-y-3 border-b border-border/60 pb-6">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {service.category && (
              <span className="inline-flex items-center gap-1 font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                {getCategoryIcon(service.category.name)}
                {service.category.name}
              </span>
            )}
            {formattedDuration && (
              <span className="inline-flex items-center gap-1 text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border/60 font-medium">
                <Clock className="size-3.5" />
                {formattedDuration}
              </span>
            )}
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground font-mono text-[11px]">Service #{service.id}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight">
            {service.name}
          </h1>

          {service.provider && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-0.5">
              <span>Delivered by</span>
              <span className="font-semibold text-foreground inline-flex items-center gap-1">
                <BadgeCheck className="size-4 text-primary" />
                {service.provider.displayName}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="inline-flex items-center gap-1 text-success font-medium">
                <ShieldCheck className="size-3.5" />
                Verified Specialist
              </span>
              {service.provider.timezone && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span>{service.provider.timezone}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Main Two-Column Layout (2 Cols Left, 1 Col Right Sticky) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Visual Showcase, Scope, Highlights, Steps */}
          <div className="lg:col-span-2 space-y-6">
            {/* Visual Media Header or Branded Showcase */}
            {activeImage ? (
              <div className="relative rounded-2xl overflow-hidden border border-border bg-card shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeImage}
                  alt={service.name}
                  className="w-full h-72 sm:h-96 object-cover"
                />

                {accessibleImages.length > 1 && (
                  <div className="flex items-center gap-2 p-3 bg-card border-t border-border overflow-x-auto">
                    {accessibleImages.map((img, idx) => (
                      <button
                        key={img.id || idx}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
                        className={cn(
                          "size-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all focus:outline-none focus:ring-2 focus:ring-primary",
                          selectedImageIndex === idx
                            ? "border-primary shadow-xs scale-105"
                            : "border-border/60 opacity-70 hover:opacity-100"
                        )}
                        aria-label={`View image ${idx + 1}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.storageKey}
                          alt={`${service.name} gallery image ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-border bg-gradient-to-br from-primary/10 via-card to-secondary/30 p-6 sm:p-8 shadow-xs">
                {/* Decorative background ambient elements */}
                <div className="absolute -top-16 -right-16 size-48 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 size-48 rounded-full bg-secondary/30 blur-2xl pointer-events-none" />

                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-primary/15 text-primary border border-primary/25">
                      {getCategoryIcon(service.category?.name)}
                      {service.category?.name || "Professional Marketplace Service"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-success bg-success/10 px-2.5 py-1 rounded-full border border-success/20">
                      <ShieldCheck className="size-3.5" />
                      100% Quality Assurance
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-lg sm:text-xl font-bold text-foreground">
                      Professional Service Standards Guaranteed
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl">
                      Delivered by certified technicians with full background checks, on-time commitment, and damage protection.
                    </p>
                  </div>

                  {/* 4 Feature Badges inside banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-card/85 border border-border/70 shadow-2xs">
                      <CheckCircle2 className="size-4 text-success shrink-0" />
                      <span className="text-[11px] font-semibold text-foreground">Certified Pro</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-card/85 border border-border/70 shadow-2xs">
                      <Lock className="size-4 text-primary shrink-0" />
                      <span className="text-[11px] font-semibold text-foreground">15-Min Slot Lock</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-card/85 border border-border/70 shadow-2xs">
                      <Clock className="size-4 text-primary shrink-0" />
                      <span className="text-[11px] font-semibold text-foreground">On-Time Arrival</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-card/85 border border-border/70 shadow-2xs">
                      <Award className="size-4 text-success shrink-0" />
                      <span className="text-[11px] font-semibold text-foreground">Warranty Covered</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Service Highlights (4 Feature Cards in 2x2 Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Card className="p-4 bg-card border-border shadow-2xs hover:border-primary/40 transition-colors space-y-1.5">
                <div className="flex items-center gap-2.5 text-foreground font-bold text-sm">
                  <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Zap className="size-4" />
                  </div>
                  <span>Full Diagnostic Assessment</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pl-10">
                  Comprehensive inspection testing all key systems, circuits, and components to detect underlying faults.
                </p>
              </Card>

              <Card className="p-4 bg-card border-border shadow-2xs hover:border-primary/40 transition-colors space-y-1.5">
                <div className="flex items-center gap-2.5 text-foreground font-bold text-sm">
                  <div className="size-8 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
                    <ShieldCheck className="size-4" />
                  </div>
                  <span>Certified Safety Standards</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pl-10">
                  Conducted strictly adhering to marketplace and industry safety guidelines by verified professionals.
                </p>
              </Card>

              <Card className="p-4 bg-card border-border shadow-2xs hover:border-primary/40 transition-colors space-y-1.5">
                <div className="flex items-center gap-2.5 text-foreground font-bold text-sm">
                  <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Lock className="size-4" />
                  </div>
                  <span>15-Minute Slot Hold Lock</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pl-10">
                  Guaranteed schedule protection: your appointment slot is exclusively held while completing checkout.
                </p>
              </Card>

              <Card className="p-4 bg-card border-border shadow-2xs hover:border-primary/40 transition-colors space-y-1.5">
                <div className="flex items-center gap-2.5 text-foreground font-bold text-sm">
                  <div className="size-8 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
                    <CheckCircle2 className="size-4" />
                  </div>
                  <span>Transparent Fixed Pricing</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pl-10">
                  Upfront flat-rate pricing with zero hidden surcharges or surprise post-booking fees.
                </p>
              </Card>
            </div>

            {/* About / Description Card */}
            <Card className="p-6 space-y-4 bg-card border-border shadow-2xs">
              <div className="border-b border-border pb-3">
                <h2 className="text-lg font-bold text-foreground">
                  About this Service
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Detailed overview, scope of work, and delivery standards
                </p>
              </div>

              <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line space-y-3">
                {service.description || "No detailed description provided for this service."}
              </div>
            </Card>

            {/* How Booking Works (3-Step Roadmap) */}
            <Card className="p-6 space-y-4 bg-card border-border shadow-2xs">
              <div className="border-b border-border pb-3">
                <h2 className="text-lg font-bold text-foreground">
                  How Booking Works
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Seamless 3-step checkout backed by ServiceHub guarantees
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="space-y-2 p-3.5 rounded-xl bg-muted/40 border border-border/60">
                  <div className="size-7 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center shadow-xs">
                    1
                  </div>
                  <h3 className="font-bold text-xs text-foreground">Choose Date & Slot</h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Select your preferred day and available time slot from the provider&apos;s real-time schedule.
                  </p>
                </div>

                <div className="space-y-2 p-3.5 rounded-xl bg-muted/40 border border-border/60">
                  <div className="size-7 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center shadow-xs">
                    2
                  </div>
                  <h3 className="font-bold text-xs text-foreground">15-Minute Slot Hold</h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    We lock your chosen time slot for 15 minutes while you confirm your delivery address.
                  </p>
                </div>

                <div className="space-y-2 p-3.5 rounded-xl bg-muted/40 border border-border/60">
                  <div className="size-7 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center shadow-xs">
                    3
                  </div>
                  <h3 className="font-bold text-xs text-foreground">Service Delivered</h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Your verified provider arrives at the scheduled hour and completes the service.
                  </p>
                </div>
              </div>
            </Card>

            {/* Service Specifications Card */}
            <Card className="p-6 space-y-4 bg-card border-border shadow-2xs">
              <div className="border-b border-border pb-3">
                <h2 className="text-lg font-bold text-foreground">
                  Service Specifications
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/60">
                  <Tag className="size-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground block">
                      Category
                    </span>
                    <span className="text-muted-foreground">
                      {service.category?.name || "General Marketplace"}
                    </span>
                    {service.category?.description && (
                      <span className="text-[11px] text-muted-foreground/80 block mt-0.5">
                        {service.category.description}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/60">
                  <Clock className="size-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground block">
                      Estimated Duration
                    </span>
                    <span className="text-muted-foreground">
                      {service.durationMinutes} minutes ({formattedDuration})
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/60">
                  <CheckCircle2 className="size-4 text-success shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground block">
                      Pricing Model
                    </span>
                    <span className="text-muted-foreground">
                      Fixed Service Price (transparent checkout)
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/60">
                  <Calendar className="size-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground block">
                      Service ID
                    </span>
                    <span className="text-muted-foreground font-mono">
                      #{service.id}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Sticky Reservation & Action Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              <Card className="p-6 space-y-5 bg-card border-border shadow-lg rounded-2xl relative overflow-hidden">
                {/* Top decorative accent bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-primary/80 to-amber-500" />

                {/* Price Header */}
                <div className="space-y-1.5 border-b border-border pb-4 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Total Fixed Price
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/20">
                      <span className="size-1.5 rounded-full bg-success" />
                      Instant Booking
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-black text-foreground tracking-tight">
                      ${service.price.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      USD (fixed rate)
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    No hidden charges • Complete labor included
                  </p>
                </div>

                {/* Primary Call to Action Button */}
                <div className="space-y-2.5">
                  <Button
                    id="start-booking-this-service-btn"
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={() => setIsBookingModalOpen(true)}
                    leftIcon={<Calendar className="size-5" />}
                    className="font-bold text-sm sm:text-base py-3.5 shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/35 transition-all active:scale-[0.99]"
                  >
                    Start Booking This Service
                  </Button>

                  <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
                    ⚡ Slot reserved exclusively for 15 minutes once selected.
                  </p>
                </div>

                {/* Key Guarantees & Features */}
                <div className="space-y-3 pt-2 border-t border-border text-xs">
                  <div className="flex items-start gap-3 text-foreground/90">
                    <Clock className="size-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block text-foreground">
                        {formattedDuration || `${service.durationMinutes} mins`} service duration
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Dedicated on-site professional service
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-foreground/90">
                    <ShieldCheck className="size-4 text-success shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block text-foreground">
                        Verified Professional
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Delivered by {service.provider?.displayName || "an approved provider"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-foreground/90">
                    <Lock className="size-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block text-foreground">
                        15-Min Hold Lock Protection
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Your appointment time slot is reserved while you check out
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-foreground/90">
                    <CheckCircle2 className="size-4 text-success shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block text-foreground">
                        Satisfaction Guaranteed
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Transparent fixed checkout with zero surprise fees
                      </span>
                    </div>
                  </div>
                </div>

                {/* Trust Footer */}
                <div className="pt-3 border-t border-border flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                  <ShieldCheck className="size-3.5 text-success" />
                  <span>Free cancellation up to 24h prior</span>
                </div>
              </Card>

              {/* Secondary Provider Quick Card in Sidebar */}
              {service.provider && (
                <Card className="p-4 bg-card border-border shadow-xs space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-xl bg-primary/10 text-primary font-bold text-base flex items-center justify-center shrink-0 border border-primary/20">
                      {service.provider.displayName?.charAt(0).toUpperCase() || "P"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Service Provider
                      </span>
                      <h4 className="text-sm font-bold text-foreground truncate">
                        {service.provider.displayName}
                      </h4>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
                      <BadgeCheck className="size-3" />
                      Verified
                    </span>
                  </div>

                  <div className="pt-2 border-t border-border/60 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-muted/40">
                      <span className="text-muted-foreground block text-[10px]">Response Time</span>
                      <span className="font-semibold text-foreground">&lt; 15 mins</span>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/40">
                      <span className="text-muted-foreground block text-[10px]">Quality Rating</span>
                      <span className="font-semibold text-foreground flex items-center gap-0.5">
                        <Star className="size-3 fill-amber-400 text-amber-400" />
                        4.9 / 5.0
                      </span>
                    </div>
                  </div>

                  {service.provider.bio && (
                    <p className="text-xs text-muted-foreground leading-relaxed pt-1 line-clamp-3">
                      {service.provider.bio}
                    </p>
                  )}
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Sticky Booking Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border p-3.5 shadow-lg flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-muted-foreground uppercase font-medium block">
              Total Fixed Price
            </span>
            <span className="text-xl font-bold text-foreground">
              ${service.price.toFixed(2)}
            </span>
          </div>
          <Button
            id="mobile-start-booking-btn"
            variant="primary"
            size="default"
            onClick={() => setIsBookingModalOpen(true)}
            leftIcon={<Calendar className="size-4" />}
            className="font-bold shadow-md shadow-primary/20"
          >
            Start Booking This Service
          </Button>
        </div>

        {/* Booking Flow Dialog Modal */}
        <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-0 border border-border bg-card shadow-2xl rounded-2xl">
            <DialogHeader className="sr-only">
              <DialogTitle>Start Booking {service.name}</DialogTitle>
              <DialogDescription>
                Select an appointment date, reserve an available time slot, and submit your delivery address.
              </DialogDescription>
            </DialogHeader>
            <BookingFlowCard
              service={service}
              className="border-0 shadow-none bg-transparent"
              onClose={() => setIsBookingModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </MarketplaceShell>
  )
}
