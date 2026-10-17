"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Calendar,
  Sparkles,
  LogOut,
  Plus,
  Shield,
  Star,
  Clock,
  CheckCircle2,
  Search,
} from "lucide-react"

import { useAppSelector } from "@/lib/hooks"
import { useLogoutMutation } from "@/features/auth/auth.api"
import { ProtectedRoute } from "@/features/auth/protected-route"
import { PageContainer } from "@/components/layout/page-container"
import { Button } from "@/components/ui/button"
import { WebText } from "@/components/ui/web-text"
import { Card } from "@/components/data-display/base-card"
import { StatisticCard } from "@/components/data-display/statistic-card"
import { BookingCard } from "@/components/data-display/booking-card"
import { ServiceCard } from "@/components/data-display/service-card"
import { StatusBadge } from "@/components/data-display/status-badge"
import { showSuccessToast } from "@/shared/ui/toast-service"

export default function DashboardHomePage() {
  const router = useRouter()
  const user = useAppSelector((state) => state.auth.user)
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation()

  const handleLogout = async () => {
    try {
      await logout().unwrap()
      showSuccessToast("Signed Out", {
        description: "You have been safely signed out.",
      })
      router.replace("/")
    } catch {
      router.replace("/")
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
        {/* Top Authenticated Header */}
        <header className="sticky top-0 z-30 w-full border-b border-border bg-card/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                <Sparkles className="size-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-primary">
                ServiceHub
              </span>
            </Link>

            {/* User Profile & Actions */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-semibold text-foreground">
                  {user?.firstName} {user?.lastName || ""}
                </span>
                <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                  {user?.email}
                </span>
              </div>

              <div className="h-6 w-px bg-border hidden sm:block" />

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                isLoading={isLoggingOut}
                leftIcon={<LogOut className="size-3.5" />}
              >
                Log Out
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Main Workspace */}
        <main className="flex-1 py-8">
          <PageContainer maxWidth="xl" className="space-y-8">
            {/* Welcome Greeting Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-primary via-maroon-700 to-primary p-6 sm:p-10 text-white shadow-lg">
              <div className="relative z-10 max-w-2xl space-y-3">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-xs">
                  <Shield className="size-3.5" />
                  <span>Verified Customer Workspace</span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">
                  Welcome back, {user?.firstName || "Customer"}!
                </h1>

                <p className="text-sm sm:text-base text-rose-100/90 leading-relaxed">
                  Your upcoming home and personal services are on schedule. Explore new verified pros
                  or manage existing bookings below.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white text-primary hover:bg-rose-50 font-semibold"
                    asChild
                  >
                    <Link href="/services">
                      <Plus className="size-4 mr-1.5" /> Book New Service
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/40 text-white hover:bg-white/10"
                    asChild
                  >
                    <Link href="#my-bookings">View Active Schedule</Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick KPI Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatisticCard
                title="Active Bookings"
                value="2"
                description="Next service tomorrow at 10:00 AM"
                icon={<Calendar />}
              />
              <StatisticCard
                title="Completed Services"
                value="7"
                change={{ value: "+2", isPositive: true, label: "this month" }}
                icon={<CheckCircle2 />}
              />
              <StatisticCard
                title="Total Investment"
                value="$840.00"
                description="Protected by zero-deductible coverage"
                icon={<Shield />}
              />
              <StatisticCard
                title="Average Pro Rating"
                value="4.95 ★"
                description="Consistently 5-star verified pros"
                icon={<Star />}
              />
            </div>

            {/* Active Bookings Section */}
            <section id="my-bookings" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <WebText variant="h3">Upcoming Service Appointments</WebText>
                  <WebText variant="muted">
                    Track arrival times, service pro notes, and schedule updates.
                  </WebText>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/bookings">View All (2)</Link>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BookingCard
                  id="bk-8901"
                  bookingReference="BK-8901"
                  serviceTitle="Complete Deep House Cleaning (3 Rooms)"
                  partyName="CleanSpark Pros (Maria G.)"
                  partyRole="Provider"
                  status="CONFIRMED"
                  scheduledDate="Saturday, Oct 24, 2026"
                  scheduledTime="10:00 AM - 1:00 PM"
                  address="742 Evergreen Terrace, Springfield"
                  totalAmount={120.0}
                  onReschedule={() =>
                    showSuccessToast("Reschedule Requested", {
                      description: "Pro will confirm your preferred new time.",
                    })
                  }
                />

                <BookingCard
                  id="bk-8902"
                  bookingReference="BK-8902"
                  serviceTitle="Kitchen Sink Drainage Inspection & Repair"
                  partyName="AquaFlow Master (David C.)"
                  partyRole="Provider"
                  status="PENDING"
                  scheduledDate="Sunday, Oct 25, 2026"
                  scheduledTime="2:00 PM - 3:30 PM"
                  address="742 Evergreen Terrace, Springfield"
                  totalAmount={85.0}
                  onCancel={() =>
                    showSuccessToast("Cancellation Requested", {
                      description: "Booking #BK-8902 pending cancellation review.",
                    })
                  }
                />
              </div>
            </section>

            {/* Recommended Services Carousel / Grid */}
            <section className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <WebText variant="h3">Popular Services Near You</WebText>
                  <WebText variant="muted">
                    Highly rated home and technical services available in your zip code.
                  </WebText>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/services">Browse Marketplace →</Link>
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <ServiceCard
                  id="srv-rec-1"
                  title="Electrical Panel Upgrade & Circuit Repair"
                  description="Licensed master electrician for breaker diagnosis, panel replacement, and GFCI repairs."
                  category="Electrical"
                  price={65}
                  priceType="HOURLY"
                  rating={5.0}
                  reviewCount={38}
                  providerName="VoltCraft Electric"
                  durationMinutes={90}
                  onBook={() =>
                    showSuccessToast("Service Selected", {
                      description: "Opening booking drawer for VoltCraft Electric...",
                    })
                  }
                />

                <ServiceCard
                  id="srv-rec-2"
                  title="Interior Wall Painting & Touch-Ups"
                  description="Flawless brushwork and rolling with premium low-VOC coatings and furniture protection."
                  category="Painting"
                  price={110}
                  priceType="FIXED"
                  rating={4.8}
                  reviewCount={52}
                  providerName="Artisan Coat Pros"
                  durationMinutes={180}
                  onBook={() =>
                    showSuccessToast("Service Selected", {
                      description: "Opening booking drawer for Artisan Coat Pros...",
                    })
                  }
                />

                <ServiceCard
                  id="srv-rec-3"
                  title="HVAC Air Duct & Filter Sanitization"
                  description="HEPA vacuum duct cleaning, coil disinfection, and high-efficiency allergen filter replacement."
                  category="HVAC"
                  price={95}
                  priceType="FIXED"
                  rating={4.9}
                  reviewCount={27}
                  providerName="AirPure Solutions"
                  durationMinutes={120}
                  onBook={() =>
                    showSuccessToast("Service Selected", {
                      description: "Opening booking drawer for AirPure Solutions...",
                    })
                  }
                />
              </div>
            </section>
          </PageContainer>
        </main>

        {/* Dashboard Footer */}
        <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground bg-card">
          <p>© 2026 ServiceHub Smart Service Marketplace. All bookings insured & protected.</p>
        </footer>
      </div>
  )
}
