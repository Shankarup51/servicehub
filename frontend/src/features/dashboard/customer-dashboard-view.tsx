"use client"

import * as React from "react"
import Link from "next/link"
import {
  Sparkles,
  Filter,
} from "lucide-react"

import { MarketplaceShell, ActiveFilter } from "@/components/layout/marketplace-shell"
import { ServiceCard } from "@/components/data-display/service-card"
import { BookingCard } from "@/components/data-display/booking-card"
import { EmptyState } from "@/components/feedback/empty-state"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { showSuccessToast } from "@/shared/ui/toast-service"
import { cn } from "@/lib/utils"


interface ServiceItem {
  id: string
  title: string
  category: string
  price: number
  priceType: "HOURLY" | "FIXED"
  rating: number
  reviewCount: number
  providerName: string
  durationMinutes: number
  imageUrl: string
  description: string
  location: string
  acceptingNew: boolean
}

const CATEGORIES = [
  { id: "house-section", label: "House section", count: 24 },
  { id: "carpentry", label: "Carpentry", count: 12 },
  { id: "electrical-works", label: "Electrical works", count: 18 },
  { id: "plumbing", label: "Plumbing", count: 15 },
  { id: "furniture-works", label: "Furniture works", count: 9 },
  { id: "painting", label: "Painting", count: 14 },
  { id: "assembling", label: "Assembling", count: 11 },
  { id: "landscaping", label: "Landscaping", count: 8 },
  { id: "general-maintenance", label: "General Maintenance", count: 22 },
]

const PRICE_RANGES = [
  { id: "all", label: "All Prices", min: 0, max: Infinity },
  { id: "p10-20", label: "$10 to $20", min: 10, max: 20 },
  { id: "p21-30", label: "$21 to $30", min: 21, max: 30 },
  { id: "p31-40", label: "$31 to $40", min: 31, max: 40 },
  { id: "p41-50", label: "$41 to $50", min: 41, max: 50 },
  { id: "p51-plus", label: "$51 and above", min: 51, max: Infinity },
]

const INITIAL_SERVICES: ServiceItem[] = [
  {
    id: "srv-1",
    title: "Home Complete Cleaning Solutions",
    category: "House section",
    price: 35,
    priceType: "HOURLY",
    rating: 4.9,
    reviewCount: 156,
    providerName: "Sparkle Pro Team",
    durationMinutes: 120,
    imageUrl: "/services/cleaning.jpg",
    description: "Deep sanitize living rooms, kitchen counters, polished floors & bedrooms.",
    location: "Downtown",
    acceptingNew: true,
  },
  {
    id: "srv-2",
    title: "Setup Kitchen Appliances Easily",
    category: "House section",
    price: 35,
    priceType: "HOURLY",
    rating: 4.9,
    reviewCount: 156,
    providerName: "Volt & Pipe Masters",
    durationMinutes: 90,
    imageUrl: "/services/appliances.jpg",
    description: "Certified appliance diagnosis, hookup, microwave setup & dishwasher calibration.",
    location: "Westside",
    acceptingNew: true,
  },
  {
    id: "srv-3",
    title: "Sparkle Ease Cleaning Solutions",
    category: "House section",
    price: 35,
    priceType: "HOURLY",
    rating: 4.9,
    reviewCount: 156,
    providerName: "EcoPure Cleaners",
    durationMinutes: 120,
    imageUrl: "/services/cleaning.jpg",
    description: "Thorough move-in/move-out deep sanitization and eco-friendly allergen scrub.",
    location: "North End",
    acceptingNew: true,
  },
  {
    id: "srv-4",
    title: "General Woodwork & Cabinetry Repair",
    category: "Carpentry",
    price: 45,
    priceType: "HOURLY",
    rating: 4.8,
    reviewCount: 98,
    providerName: "Artisan Joinery",
    durationMinutes: 180,
    imageUrl: "/services/maintenance.jpg",
    description: "Custom shelving, door realignment, hinge fixing, and sturdy trim repairs.",
    location: "Downtown",
    acceptingNew: true,
  },
  {
    id: "srv-5",
    title: "Electrical Panel Upgrades & Circuit Diagnostics",
    category: "Electrical works",
    price: 65,
    priceType: "HOURLY",
    rating: 5.0,
    reviewCount: 42,
    providerName: "VoltCraft Electrical",
    durationMinutes: 90,
    imageUrl: "/services/appliances.jpg",
    description: "Licensed master electrician for breaker replacements, outlets and GFCI.",
    location: "South Hills",
    acceptingNew: true,
  },
  {
    id: "srv-6",
    title: "Precision Interior Wall Painting",
    category: "Painting",
    price: 38,
    priceType: "HOURLY",
    rating: 4.9,
    reviewCount: 84,
    providerName: "Flawless Coat Pros",
    durationMinutes: 240,
    imageUrl: "/services/maintenance.jpg",
    description: "Crisp wall lines, priming, touch-ups and surface repair using low-VOC paint.",
    location: "Westside",
    acceptingNew: true,
  },
]

export function CustomerDashboardView() {
  // Filter States (mimicking Handypal reference)
  const [acceptingNewOnly, setAcceptingNewOnly] = React.useState(true)
  const [selectedCategory, setSelectedCategory] = React.useState<string>("House section")
  const [selectedPriceRange, setSelectedPriceRange] = React.useState<string>("p31-40")
  const [selectedLocation, setSelectedLocation] = React.useState<string>("all")
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [sortOption, setSortOption] = React.useState<string>("highest-ratings")

  // Bookings state
  const [bookings] = React.useState([
    {
      id: "bk-8901",
      bookingReference: "BK-8901",
      serviceTitle: "Complete Deep House Cleaning (3 Rooms)",
      partyName: "CleanSpark Pros (Maria G.)",
      partyRole: "Provider" as const,
      status: "CONFIRMED" as const,
      scheduledDate: "Saturday, Oct 24, 2026",
      scheduledTime: "10:00 AM - 1:00 PM",
      address: "742 Evergreen Terrace, Springfield",
      totalAmount: 120.0,
    },
    {
      id: "bk-8902",
      bookingReference: "BK-8902",
      serviceTitle: "Kitchen Sink Drainage Inspection & Repair",
      partyName: "AquaFlow Master (David C.)",
      partyRole: "Provider" as const,
      status: "PENDING" as const,
      scheduledDate: "Sunday, Oct 25, 2026",
      scheduledTime: "2:00 PM - 3:30 PM",
      address: "742 Evergreen Terrace, Springfield",
      totalAmount: 85.0,
    },
  ])

  // Active filters list
  const activeFilters = React.useMemo<ActiveFilter[]>(() => {
    const filters: ActiveFilter[] = []

    if (selectedCategory && selectedCategory !== "all") {
      filters.push({
        id: "cat",
        label: selectedCategory,
        onRemove: () => setSelectedCategory("all"),
      })
    }

    if (selectedPriceRange && selectedPriceRange !== "all") {
      const pRange = PRICE_RANGES.find((p) => p.id === selectedPriceRange)
      if (pRange) {
        filters.push({
          id: "price",
          label: pRange.label,
          onRemove: () => setSelectedPriceRange("all"),
        })
      }
    }

    if (selectedLocation && selectedLocation !== "all") {
      filters.push({
        id: "loc",
        label: selectedLocation,
        onRemove: () => setSelectedLocation("all"),
      })
    }

    if (searchQuery.trim()) {
      filters.push({
        id: "search",
        label: `"${searchQuery}"`,
        onRemove: () => setSearchQuery(""),
      })
    }

    return filters
  }, [selectedCategory, selectedPriceRange, selectedLocation, searchQuery])

  const handleClearAllFilters = () => {
    setSelectedCategory("all")
    setSelectedPriceRange("all")
    setSelectedLocation("all")
    setSearchQuery("")
    showSuccessToast("Filters Cleared", { description: "Reset to all marketplace listings." })
  }

  // Filter and sort the services
  const filteredServices = React.useMemo(() => {
    return INITIAL_SERVICES.filter((item) => {
      if (acceptingNewOnly && !item.acceptingNew) return false

      if (selectedCategory !== "all" && item.category !== selectedCategory) {
        return false
      }

      if (selectedPriceRange !== "all") {
        const pRange = PRICE_RANGES.find((p) => p.id === selectedPriceRange)
        if (pRange && (item.price < pRange.min || item.price > pRange.max)) {
          return false
        }
      }

      if (selectedLocation !== "all" && item.location !== selectedLocation) {
        return false
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesTitle = item.title.toLowerCase().includes(query)
        const matchesCat = item.category.toLowerCase().includes(query)
        const matchesPro = item.providerName.toLowerCase().includes(query)
        if (!matchesTitle && !matchesCat && !matchesPro) return false
      }

      return true
    }).sort((a, b) => {
      if (sortOption === "highest-ratings") return b.rating - a.rating
      if (sortOption === "most-booked") return b.reviewCount - a.reviewCount
      if (sortOption === "price-asc") return a.price - b.price
      if (sortOption === "price-desc") return b.price - a.price
      return 0
    })
  }, [acceptingNewOnly, selectedCategory, selectedPriceRange, selectedLocation, searchQuery, sortOption])

  // Left Filter Panel (as depicted in Handypal reference)
  const leftFilterPanel = (
    <div className="space-y-6 text-[#242424]">
      {/* Filter Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-[#AD8066]" />
          <h3 className="font-bold text-sm tracking-tight text-[#242424]">Filter</h3>
        </div>
        {activeFilters.length > 0 && (
          <button
            type="button"
            onClick={handleClearAllFilters}
            className="text-xs text-[#AD8066] hover:text-[#94684F] font-medium"
          >
            Reset
          </button>
        )}
      </div>

      {/* Accepting new customers switch */}
      <div className="flex items-center justify-between py-2">
        <label
          htmlFor="accepting-new-switch"
          className="text-xs font-medium text-[#242424] cursor-pointer"
        >
          Accepting new customers
        </label>
        <Switch
          id="accepting-new-switch"
          checked={acceptingNewOnly}
          onCheckedChange={setAcceptingNewOnly}
        />
      </div>

      {/* All Categories Radio List */}
      <div className="space-y-3 pt-2 border-t border-[#E5E5E5]">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B]">
          All Categories
        </h4>
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left",
              selectedCategory === "all"
                ? "bg-[#F5F5F5] font-semibold text-[#AD8066]"
                : "text-[#242424] hover:bg-[#F5F5F5]"
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "size-3 rounded-full border flex items-center justify-center",
                  selectedCategory === "all"
                    ? "border-[#AD8066] bg-[#AD8066]"
                    : "border-[#6B6B6B]"
                )}
              >
                {selectedCategory === "all" && <span className="size-1 rounded-full bg-white" />}
              </span>
              <span>All Categories</span>
            </div>
            <span className="text-[11px] text-[#6B6B6B]">128</span>
          </button>

          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.label
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.label)}
                className={cn(
                  "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left",
                  isSelected
                    ? "bg-[#F5F5F5] font-semibold text-[#AD8066]"
                    : "text-[#242424] hover:bg-[#F5F5F5]"
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "size-3 rounded-full border flex items-center justify-center",
                      isSelected
                        ? "border-[#AD8066] bg-[#AD8066]"
                        : "border-[#6B6B6B]"
                    )}
                  >
                    {isSelected && <span className="size-1 rounded-full bg-white" />}
                  </span>
                  <span>{cat.label}</span>
                </div>
                <span className="text-[11px] text-[#6B6B6B]">{cat.count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Price Checkboxes */}
      <div className="space-y-3 pt-3 border-t border-[#E5E5E5]">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B]">Price</h4>
        <RadioGroup
          value={selectedPriceRange}
          onValueChange={setSelectedPriceRange}
          className="gap-1.5"
        >
          {PRICE_RANGES.map((range) => (
            <div
              key={range.id}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#F5F5F5] transition-colors"
            >
              <RadioGroupItem
                value={range.id}
                id={`price-${range.id}`}
                className="size-4 border-[#AD8066]/50 data-[state=checked]:border-[#AD8066]"
                label={<span className="text-xs text-[#242424] font-normal cursor-pointer">{range.label}</span>}
              />
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Location Selector */}
      <div className="space-y-2 pt-3 border-t border-[#E5E5E5]">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B]">Location</h4>
        <Select
          value={selectedLocation}
          onValueChange={setSelectedLocation}
          options={[
            { label: "Select location", value: "all" },
            { label: "Downtown Springfield", value: "Downtown" },
            { label: "Westside District", value: "Westside" },
            { label: "North End Suburbs", value: "North End" },
            { label: "South Hills Heights", value: "South Hills" },
          ]}
          triggerClassName="h-9 rounded-lg border-[#E5E5E5] bg-white text-xs text-[#242424]"
        />
      </div>
    </div>
  )

  return (
    <MarketplaceShell
      currentRole="CUSTOMER"
      breadcrumbs={[{ label: "Dashboard" }]}
      heading="Reliable home repair and maintenance services"
      subheading="Explore background-checked professionals ready to take on your household and technical needs."
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search services, cleaners, electricians..."
      sortOption={sortOption}
      onSortChange={setSortOption}
      activeFilters={activeFilters}
      onClearAllFilters={handleClearAllFilters}
      leftPanel={leftFilterPanel}
    >
      {/* Service Card Grid (Matching Handypal Reference Screenshot) */}
      <div className="space-y-8">
        {filteredServices.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
            {filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                id={service.id}
                title={service.title}
                description={service.description}
                category={service.category}
                price={service.price}
                priceType={service.priceType}
                rating={service.rating}
                reviewCount={service.reviewCount}
                providerName={service.providerName}
                durationMinutes={service.durationMinutes}
                imageUrl={service.imageUrl}
                onBook={() =>
                  showSuccessToast("Service Selected", {
                    description: `Selected "${service.title}" by ${service.providerName}.`,
                  })
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Sparkles className="size-6 text-[#AD8066]" />}
            title="No services found"
            description="No verified services match your currently selected filters. Try broadening your category or price range."
            action={
              <Button size="sm" variant="outline" onClick={handleClearAllFilters} className="border-[#E5E5E5] text-xs">
                Reset All Filters
              </Button>
            }
            className="border-[#E5E5E5] bg-[#F5F5F5]/40 py-12"
          />
        )}

        {/* Customer Upcoming Appointments Section */}
        <section className="pt-8 border-t border-[#E5E5E5] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-[#242424]">Upcoming Service Appointments</h2>
              <p className="text-xs text-[#6B6B6B]">
                Track arrival schedule, service pro notes, and booking confirmation updates.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild className="border-[#E5E5E5] text-xs">
              <Link href="/bookings">View All Bookings ({bookings.length})</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                id={booking.id}
                bookingReference={booking.bookingReference}
                serviceTitle={booking.serviceTitle}
                partyName={booking.partyName}
                partyRole={booking.partyRole}
                status={booking.status}
                scheduledDate={booking.scheduledDate}
                scheduledTime={booking.scheduledTime}
                address={booking.address}
                totalAmount={booking.totalAmount}
                onReschedule={() =>
                  showSuccessToast("Reschedule Requested", {
                    description: `Reschedule requested for ${booking.bookingReference}.`,
                  })
                }
                onCancel={() =>
                  showSuccessToast("Cancellation Requested", {
                    description: `Cancellation requested for ${booking.bookingReference}.`,
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
