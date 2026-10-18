"use client"

import * as React from "react"
import Link from "next/link"
import {
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Shield,
  Briefcase,
  AlertCircle,
  TrendingUp,
  MapPin,
  User,
  Check,
} from "lucide-react"

import { MarketplaceShell, ActiveFilter } from "@/components/layout/marketplace-shell"
import { StatisticCard } from "@/components/data-display/statistic-card"
import { StatusBadge } from "@/components/data-display/status-badge"
import { ServiceCard } from "@/components/data-display/service-card"
import { EmptyState } from "@/components/feedback/empty-state"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { showSuccessToast, showErrorToast } from "@/shared/ui/toast-service"
import { cn } from "@/lib/utils"


interface ProviderBookingRequest {
  id: string
  reference: string
  customerName: string
  serviceTitle: string
  date: string
  time: string
  location: string
  amount: number
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED"
}

interface ProviderService {
  id: string
  title: string
  category: string
  rate: number
  priceType: "HOURLY" | "FIXED"
  rating: number
  reviewCount: number
  durationMinutes: number
  isActive: boolean
  imageUrl: string
}

const INITIAL_REQUESTS: ProviderBookingRequest[] = [
  {
    id: "req-1",
    reference: "REQ-4011",
    customerName: "Sarah Jenkins",
    serviceTitle: "Kitchen Sink Drainage Inspection & Repair",
    date: "Tuesday, Oct 20, 2026",
    time: "11:00 AM - 12:30 PM",
    location: "412 Oak Lane, Downtown",
    amount: 85.0,
    status: "PENDING",
  },
  {
    id: "req-2",
    reference: "REQ-4012",
    customerName: "Michael Chang",
    serviceTitle: "Electrical Panel Upgrades & Circuit Diagnostics",
    date: "Wednesday, Oct 21, 2026",
    time: "2:00 PM - 3:30 PM",
    location: "78 Elm Street, Westside",
    amount: 130.0,
    status: "PENDING",
  },
  {
    id: "req-3",
    reference: "REQ-4009",
    customerName: "Elena Rostova",
    serviceTitle: "Home Complete Cleaning Solutions",
    date: "Thursday, Oct 22, 2026",
    time: "9:00 AM - 12:00 PM",
    location: "15 Highland Ave, North End",
    amount: 120.0,
    status: "CONFIRMED",
  },
]

const INITIAL_PROVIDER_SERVICES: ProviderService[] = [
  {
    id: "ps-1",
    title: "Setup Kitchen Appliances Easily",
    category: "House section",
    rate: 35,
    priceType: "HOURLY",
    rating: 4.9,
    reviewCount: 156,
    durationMinutes: 90,
    isActive: true,
    imageUrl: "/services/appliances.jpg",
  },
  {
    id: "ps-2",
    title: "General Woodwork & Cabinetry Repair",
    category: "Carpentry",
    rate: 45,
    priceType: "HOURLY",
    rating: 4.8,
    reviewCount: 98,
    durationMinutes: 180,
    isActive: true,
    imageUrl: "/services/maintenance.jpg",
  },
  {
    id: "ps-3",
    title: "Home Complete Cleaning Solutions",
    category: "House section",
    rate: 35,
    priceType: "HOURLY",
    rating: 4.9,
    reviewCount: 64,
    durationMinutes: 120,
    isActive: true,
    imageUrl: "/services/cleaning.jpg",
  },
]

export function ProviderDashboardView() {
  const [acceptingBookings, setAcceptingBookings] = React.useState(true)
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [sortOption, setSortOption] = React.useState<string>("date-asc")
  const [requests, setRequests] = React.useState<ProviderBookingRequest[]>(INITIAL_REQUESTS)
  const [myServices] = React.useState<ProviderService[]>(INITIAL_PROVIDER_SERVICES)

  // Accept a booking request
  const handleAcceptRequest = (id: string, ref: string) => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: "CONFIRMED" } : req))
    )
    showSuccessToast("Request Accepted", {
      description: `Booking #${ref} has been confirmed. Customer notified.`,
    })
  }

  // Decline a booking request
  const handleDeclineRequest = (id: string, ref: string) => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: "CANCELLED" } : req))
    )
    showErrorToast("Request Declined", {
      description: `Booking #${ref} was declined.`,
    })
  }

  // Active filters
  const activeFilters = React.useMemo<ActiveFilter[]>(() => {
    const list: ActiveFilter[] = []
    if (statusFilter !== "all") {
      list.push({
        id: "status",
        label: `Status: ${statusFilter}`,
        onRemove: () => setStatusFilter("all"),
      })
    }
    if (searchQuery.trim()) {
      list.push({
        id: "query",
        label: `"${searchQuery}"`,
        onRemove: () => setSearchQuery(""),
      })
    }
    return list
  }, [statusFilter, searchQuery])

  // Filter requests
  const filteredRequests = React.useMemo(() => {
    return requests.filter((req) => {
      if (statusFilter !== "all" && req.status !== statusFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          req.customerName.toLowerCase().includes(q) ||
          req.serviceTitle.toLowerCase().includes(q) ||
          req.reference.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [requests, statusFilter, searchQuery])

  const pendingCount = requests.filter((r) => r.status === "PENDING").length
  const confirmedCount = requests.filter((r) => r.status === "CONFIRMED").length

  // Left Operational Filter Panel
  const leftFilterPanel = (
    <div className="space-y-6 text-[#242424]">
      {/* Header */}
      <div className="pb-3 border-b border-[#E5E5E5] space-y-1">
        <div className="flex items-center gap-2">
          <Briefcase className="size-4 text-[#AD8066]" />
          <h3 className="font-bold text-sm tracking-tight text-[#242424]">
            Operations Filter
          </h3>
        </div>
        <p className="text-[11px] text-[#6B6B6B]">
          Filter schedule, bookings, and active customer requests.
        </p>
      </div>

      {/* Accepting Bookings switch */}
      <div className="flex items-center justify-between py-2">
        <label
          htmlFor="provider-accept-switch"
          className="text-xs font-medium text-[#242424] cursor-pointer"
        >
          Accepting new bookings
        </label>
        <Switch
          id="provider-accept-switch"
          checked={acceptingBookings}
          onCheckedChange={(val) => {
            setAcceptingBookings(val)
            showSuccessToast(
              val ? "Status: Online" : "Status: Paused",
              {
                description: val
                  ? "Your profile is active and receiving customer requests."
                  : "New booking requests are temporarily paused.",
              }
            )
          }}
        />
      </div>

      {/* Booking Status Filters */}
      <div className="space-y-3 pt-2 border-t border-[#E5E5E5]">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B]">
          Request Status
        </h4>
        <div className="space-y-1.5">
          {[
            { id: "all", label: "All Requests", count: requests.length },
            { id: "PENDING", label: "Pending Review", count: pendingCount },
            { id: "CONFIRMED", label: "Confirmed Upcoming", count: confirmedCount },
            { id: "COMPLETED", label: "Completed Jobs", count: 18 },
          ].map((item) => {
            const isSelected = statusFilter === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setStatusFilter(item.id)}
                className={cn(
                  "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left",
                  isSelected
                    ? "bg-[#F5F5F5] font-semibold text-[#AD8066]"
                    : "text-[#242424] hover:bg-[#F5F5F5]"
                )}
              >
                <span>{item.label}</span>
                <span className="text-[11px] text-[#6B6B6B]">{item.count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Quick Provider Tools */}
      <div className="space-y-2 pt-3 border-t border-[#E5E5E5]">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B]">
          Quick Tools
        </h4>
        <div className="space-y-2">
          <Button
            size="sm"
            variant="outline"
            className="w-full justify-start text-xs border-[#E5E5E5]"
            asChild
          >
            <Link href="/provider/services">
              <Plus className="size-3.5 mr-2 text-[#AD8066]" /> Add New Service
            </Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-full justify-start text-xs border-[#E5E5E5]"
            asChild
          >
            <Link href="/provider/schedule">
              <Calendar className="size-3.5 mr-2 text-[#AD8066]" /> Working Hours
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <MarketplaceShell
      currentRole="SERVICE_PROVIDER"
      breadcrumbs={[{ label: "Dashboard" }]}
      heading="Service Provider Operations & Bookings"
      subheading="Manage client service requests, track active appointments, and update service listings."
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search customer, booking ref, or service..."
      sortOption={sortOption}
      onSortChange={setSortOption}
      sortOptions={[
        { label: "Date: Soonest first", value: "date-asc" },
        { label: "Amount: High to Low", value: "amount-desc" },
      ]}
      activeFilters={activeFilters}
      onClearAllFilters={() => {
        setStatusFilter("all")
        setSearchQuery("")
      }}
      leftPanel={leftFilterPanel}
    >
      <div className="space-y-8">
        {/* Provider Verification & Status Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl border border-[#E5E5E5] bg-[#F5F5F5]/60">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl bg-[#AD8066]/15 text-[#AD8066] flex items-center justify-center shrink-0">
              <Shield className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#242424]">
                  Volt & Pipe Masters
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-[#23865B]/10 text-[#23865B] px-2 py-0.5 text-[11px] font-semibold">
                  <CheckCircle2 className="size-3" /> Verified Pro
                </span>
              </div>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                Rating: <strong className="text-[#242424]">4.95 ★</strong> (156 completed jobs) • Acceptance Rate: 98%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              size="sm"
              variant="primary"
              className="rounded-lg text-xs font-semibold px-4"
              onClick={() =>
                showSuccessToast("Schedule Updated", {
                  description: "Your availability is synchronized for this week.",
                })
              }
            >
              Sync Schedule
            </Button>
          </div>
        </div>

        {/* Operational KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatisticCard
            title="Pending Requests"
            value={pendingCount}
            description="Requires your confirmation"
            icon={<AlertCircle />}
          />
          <StatisticCard
            title="Upcoming Bookings"
            value={confirmedCount}
            description="Scheduled for this week"
            icon={<Calendar />}
          />
          <StatisticCard
            title="Active Services"
            value={myServices.length}
            description="Published in marketplace"
            icon={<Briefcase />}
          />
          <StatisticCard
            title="Monthly Revenue"
            value="$1,850.00"
            change={{ value: "+14%", isPositive: true, label: "vs last month" }}
            icon={<TrendingUp />}
          />
        </div>

        {/* Customer Booking Requests List / Table */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#242424]">
                Customer Booking Requests ({filteredRequests.length})
              </h2>
              <p className="text-xs text-[#6B6B6B]">
                Review incoming appointments and take immediate action.
              </p>
            </div>
          </div>

          {filteredRequests.length > 0 ? (
            <div className="space-y-3">
              {filteredRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col lg:flex-row lg:items-center justify-between p-4 sm:p-5 rounded-xl border border-[#E5E5E5] bg-white hover:border-[#AD8066]/40 transition-colors gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-xs font-mono font-semibold text-[#AD8066]">
                        {req.reference}
                      </span>
                      <StatusBadge
                        status={
                          req.status === "CONFIRMED"
                            ? "success"
                            : req.status === "PENDING"
                            ? "warning"
                            : "destructive"
                        }
                        hasDot
                      >
                        {req.status}
                      </StatusBadge>
                    </div>

                    <h4 className="text-sm sm:text-base font-semibold text-[#242424]">
                      {req.serviceTitle}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-[#6B6B6B]">
                      <div className="flex items-center gap-1.5">
                        <User className="size-3.5 text-[#6B6B6B] shrink-0" />
                        <span className="font-medium text-[#242424]">{req.customerName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-[#6B6B6B] shrink-0" />
                        <span>{req.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-3.5 text-[#6B6B6B] shrink-0" />
                        <span>{req.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:col-span-3 text-[11px]">
                        <MapPin className="size-3.5 text-[#6B6B6B] shrink-0" />
                        <span>{req.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Price */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between border-t lg:border-t-0 pt-3 lg:pt-0 border-[#E5E5E5] gap-3 shrink-0">
                    <div>
                      <span className="text-xs text-[#6B6B6B] block lg:text-right">Estimated Fee</span>
                      <span className="text-lg font-bold text-[#242424]">
                        ${req.amount.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {req.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            className="text-xs px-3"
                            onClick={() => handleAcceptRequest(req.id, req.reference)}
                            leftIcon={<Check className="size-3.5" />}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs border-[#E5E5E5] text-[#C74747] hover:bg-[#C74747]/10"
                            onClick={() => handleDeclineRequest(req.id, req.reference)}
                          >
                            Decline
                          </Button>
                        </>
                      )}

                      {req.status === "CONFIRMED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs border-[#E5E5E5]"
                          onClick={() =>
                            showSuccessToast("Customer Contacted", {
                              description: `Opening chat drawer for ${req.customerName}...`,
                            })
                          }
                        >
                          Message Customer
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Briefcase className="size-6 text-[#AD8066]" />}
              title="No booking requests found"
              description="No booking requests match your current filters. Try resetting status or search filters."
              action={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setStatusFilter("all")
                    setSearchQuery("")
                  }}
                  className="border-[#E5E5E5] text-xs"
                >
                  Reset Filters
                </Button>
              }
              className="border-[#E5E5E5] bg-[#F5F5F5]/40 py-10"
            />
          )}
        </section>

        {/* My Services Grid */}
        <section className="pt-8 border-t border-[#E5E5E5] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#242424]">
                My Published Services ({myServices.length})
              </h2>
              <p className="text-xs text-[#6B6B6B]">
                Your live catalog listings searchable by customers on ServiceHub.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-[#E5E5E5] text-xs self-start sm:self-auto"
              onClick={() =>
                showSuccessToast("Create Service", {
                  description: "Opening service listing builder...",
                })
              }
              leftIcon={<Plus className="size-3.5 text-[#AD8066]" />}
            >
              Add New Listing
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {myServices.map((svc) => (
              <ServiceCard
                key={svc.id}
                id={svc.id}
                title={svc.title}
                category={svc.category}
                price={svc.rate}
                priceType={svc.priceType}
                rating={svc.rating}
                reviewCount={svc.reviewCount}
                durationMinutes={svc.durationMinutes}
                imageUrl={svc.imageUrl}
                onBook={() =>
                  showSuccessToast("Edit Service", {
                    description: `Editing details for "${svc.title}".`,
                  })
                }
              />
            ))}
          </div>
        </section>
      </div>
    </MarketplaceShell>
  )
}
