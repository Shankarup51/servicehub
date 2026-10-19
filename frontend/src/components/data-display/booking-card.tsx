import * as React from "react"
import Link from "next/link"
import { Calendar, Clock, MapPin, User } from "lucide-react"
import { Card } from "./base-card"
import { StatusBadge } from "./status-badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"

export interface BookingCardProps {
  id: string
  bookingReference: string
  serviceTitle: string
  partyName: string // Provider name if customer view, Customer name if provider view
  partyRole?: "Provider" | "Customer"
  status: BookingStatus
  scheduledDate: string
  scheduledTime: string
  address?: string
  totalAmount: number
  onView?: () => void
  onCancel?: () => void
  onReschedule?: () => void
  href?: string
  className?: string
  gradient?: boolean
}

const statusMap: Record<
  BookingStatus,
  { label: string; status: "warning" | "success" | "processing" | "destructive" | "neutral" }
> = {
  PENDING: { label: "Pending Confirmation", status: "warning" },
  CONFIRMED: { label: "Confirmed", status: "success" },
  IN_PROGRESS: { label: "In Progress", status: "processing" },
  COMPLETED: { label: "Completed", status: "success" },
  CANCELLED: { label: "Cancelled", status: "destructive" },
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
}

const defaultStatusGradient = {
  card: "bg-gradient-to-br from-muted/30 via-card to-card border-border hover:border-border/80",
  topBar: "bg-gradient-to-r from-muted-foreground/30 to-muted-foreground/50",
  accentDot: "bg-muted-foreground",
  refBadge: "bg-muted text-muted-foreground border border-border",
}

export function BookingCard({
  id,
  bookingReference,
  serviceTitle,
  partyName,
  partyRole = "Provider",
  status,
  scheduledDate,
  scheduledTime,
  address,
  totalAmount,
  onView,
  onCancel,
  onReschedule,
  href = `/bookings/${id}`,
  className,
  gradient = true,
}: BookingCardProps) {
  const currentStatus = statusMap[status] || { label: status, status: "neutral" }
  const grad = gradient ? (statusGradients[status] || defaultStatusGradient) : null

  return (
    <Card
      className={cn(
        "p-5 sm:p-6 flex flex-col justify-between gap-4 relative overflow-hidden transition-all duration-200 shadow-xs hover:shadow-md",
        grad ? grad.card : "bg-card border-border",
        className
      )}
    >
      {/* Top Gradient Accent Stripe */}
      {grad && <div className={cn("absolute top-0 left-0 right-0 h-1.5", grad.topBar)} />}

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          {grad && <span className={cn("size-2 rounded-full shrink-0", grad.accentDot)} />}
          <span
            className={cn(
              "text-xs font-mono font-bold px-2 py-0.5 rounded-md",
              grad?.refBadge || "bg-muted text-muted-foreground"
            )}
          >
            {bookingReference}
          </span>
        </div>
        <StatusBadge status={currentStatus.status} hasDot>
          {currentStatus.label}
        </StatusBadge>
      </div>

      {/* Main Details */}
      <div className="space-y-3">
        <h4 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
          {serviceTitle}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="size-3.5 text-primary shrink-0" />
            <span>
              {partyRole}: <strong className="font-semibold text-foreground">{partyName}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="size-3.5 text-primary shrink-0" />
            <span className="font-medium text-foreground/90">{scheduledDate}</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="size-3.5 text-primary shrink-0" />
            <span className="font-medium text-foreground/90">{scheduledTime}</span>
          </div>

          {address && (
            <div className="flex items-center gap-2 truncate">
              <MapPin className="size-3.5 text-primary shrink-0" />
              <span className="truncate">{address}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer & Actions */}
      <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[11px] text-muted-foreground block uppercase font-medium tracking-wider">
            Total Amount
          </span>
          <span className="text-lg font-extrabold text-foreground">
            ${totalAmount.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onCancel && status === "PENDING" && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}

          {onReschedule && status === "CONFIRMED" && (
            <Button variant="outline" size="sm" onClick={onReschedule}>
              Reschedule
            </Button>
          )}

          {onView ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onView}
              className="font-semibold shadow-2xs hover:bg-primary hover:text-primary-foreground transition-all"
            >
              View Details
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="font-semibold shadow-2xs hover:bg-primary hover:text-primary-foreground transition-all"
            >
              <Link href={href}>View Details</Link>
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
