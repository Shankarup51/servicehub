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
}: BookingCardProps) {
  const currentStatus = statusMap[status] || { label: status, status: "neutral" }

  return (
    <Card className={cn("p-5 sm:p-6 flex flex-col justify-between gap-4 bg-card", className)}>
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium text-muted-foreground">
            {bookingReference}
          </span>
        </div>
        <StatusBadge status={currentStatus.status} hasDot>
          {currentStatus.label}
        </StatusBadge>
      </div>

      {/* Main Details */}
      <div className="space-y-3">
        <h4 className="text-base sm:text-lg font-semibold text-foreground">
          {serviceTitle}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="size-3.5 text-muted-foreground shrink-0" />
            <span>
              {partyRole}: <strong className="font-medium text-foreground">{partyName}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="size-3.5 text-muted-foreground shrink-0" />
            <span>{scheduledDate}</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="size-3.5 text-muted-foreground shrink-0" />
            <span>{scheduledTime}</span>
          </div>

          {address && (
            <div className="flex items-center gap-2 truncate">
              <MapPin className="size-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{address}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer & Actions */}
      <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs text-muted-foreground block">Total Amount</span>
          <span className="text-base font-bold text-foreground">
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
            <Button variant="outline" size="sm" onClick={onView}>
              View Details
            </Button>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href={href}>View Details</Link>
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
