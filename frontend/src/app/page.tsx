"use client"

import * as React from "react"
import Link from "next/link"
import {
  Sparkles,
  Shield,
  ShieldCheck,
  Clock,
  Calendar,
  Award,
  Star,
  CheckCircle2,
  ArrowRight,
  Search,
  Wrench,
  Zap,
  Paintbrush,
  Home as HomeIcon,
  Laptop,
  Truck,
  Bug,
  HelpCircle,
  PhoneCall,
  MapPin,
} from "lucide-react"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageContainer } from "@/components/layout/page-container"
import { WebText } from "@/components/ui/web-text"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/data-display/base-card"
import { CategoryCard } from "@/components/data-display/category-card"
import { ServiceCard } from "@/components/data-display/service-card"
import { StatisticCard } from "@/components/data-display/statistic-card"
import { StatusBadge } from "@/components/data-display/status-badge"
import { SearchFilterBar } from "@/components/data-display/search-filter-bar"
import { showSuccessToast } from "@/shared/ui/toast-service"

interface MarketplaceService {
  id: string
  title: string
  description: string
  category: string
  price: number
  priceType: "HOURLY" | "FIXED"
  rating: number
  reviewCount: number
  providerName: string
  durationMinutes: number
}

const FEATURED_SERVICES: MarketplaceService[] = [
  {
    id: "ac-jet-clean",
    title: "AC Servicing & Jet Cleaning",
    description: "Deep pressure cleaning, cooling gas charge diagnostics, and complete indoor/outdoor coil disinfection.",
    category: "Electrical & AC",
    price: 49,
    priceType: "HOURLY",
    rating: 4.95,
    reviewCount: 420,
    providerName: "VoltCraft Masters",
    durationMinutes: 60,
  },
  {
    id: "full-home-deep-clean",
    title: "Complete Residential Deep Cleaning",
    description: "Hospital-grade sanitization, floor scrubbing, kitchen degreasing, and bathroom scale removal.",
    category: "Home Cleaning",
    price: 135,
    priceType: "FIXED",
    rating: 4.98,
    reviewCount: 680,
    providerName: "CleanSpark Pros",
    durationMinutes: 180,
  },
  {
    id: "emergency-pipe-repair",
    title: "Pipe Leak Detection & Drain Clearance",
    description: "Rapid response plumber for burst pipes, blocked sinks, toilet fixtures, and high-pressure jetting.",
    category: "Plumbing",
    price: 65,
    priceType: "FIXED",
    rating: 4.88,
    reviewCount: 310,
    providerName: "AquaFlow Master",
    durationMinutes: 45,
  },
  {
    id: "smart-lighting-wiring",
    title: "Smart Lighting & Chandelier Installation",
    description: "Safe master electrician wiring, dimmer switch configurations, and secure high-ceiling fixture mounting.",
    category: "Electrical & AC",
    price: 55,
    priceType: "HOURLY",
    rating: 5.0,
    reviewCount: 195,
    providerName: "BrightVolt Electric",
    durationMinutes: 90,
  },
  {
    id: "interior-wall-coating",
    title: "Interior Wall Painting & Touch-Ups",
    description: "Flawless roll and brush application with premium zero-VOC paints and comprehensive furniture masking.",
    category: "Painting & Decor",
    price: 120,
    priceType: "FIXED",
    rating: 4.91,
    reviewCount: 240,
    providerName: "Artisan Coat Pros",
    durationMinutes: 240,
  },
  {
    id: "appliance-tuneup",
    title: "Washing Machine & Refrigerator Repair",
    description: "Motor diagnostic, coolant check, pump replacement, and factory OEM certified parts with warranty.",
    category: "Appliance Care",
    price: 70,
    priceType: "FIXED",
    rating: 4.86,
    reviewCount: 175,
    providerName: "TechFix Solutions",
    durationMinutes: 60,
  },
]

const CATEGORIES_LIST = [
  { id: "cleaning", name: "Home Cleaning", desc: "Deep apartment & villa sanitization", count: 28, icon: <HomeIcon /> },
  { id: "plumbing", name: "Plumbing Repairs", desc: "Leak fixing, pipes & bathroom fixtures", count: 19, icon: <Wrench /> },
  { id: "electrical", name: "Electrical & AC", desc: "Cooling service, wiring & installations", count: 24, icon: <Zap /> },
  { id: "appliance", name: "Appliance Care", desc: "Washers, refrigerators & ovens", count: 16, icon: <Laptop /> },
  { id: "painting", name: "Painting & Decor", desc: "Interior, exterior & wallpapering", count: 14, icon: <Paintbrush /> },
  { id: "moving", name: "Moving & Assembly", desc: "Furniture assembly & heavy lifting", count: 12, icon: <Truck /> },
  { id: "pest", name: "Pest Protection", desc: "Eco-friendly pest eradication", count: 11, icon: <Bug /> },
]

export default function HomePage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState("")
  const [selectedCity, setSelectedCity] = React.useState("Bangalore")

  // Filtered services based on search bar & category
  const filteredServices = React.useMemo(() => {
    return FEATURED_SERVICES.filter((service) => {
      const matchesSearch =
        searchQuery === "" ||
        service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.providerName.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCat =
        selectedCategory === "" ||
        service.category.toLowerCase().includes(selectedCategory.toLowerCase())

      return matchesSearch && matchesCat
    })
  }, [searchQuery, selectedCategory])

  const handleBookService = (serviceTitle: string) => {
    showSuccessToast(`Selected: ${serviceTitle}`, {
      description: "Redirecting to instant checkout scheduling...",
    })
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* Top Banner & Location Bar */}
      <div className="bg-primary text-primary-foreground text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <Sparkles className="size-3.5 text-rose-200" />
            <span>Seasonal Promo: Get 20% off your first deep clean or AC tune-up with code <strong>CLEAN20</strong></span>
          </div>
          <div className="flex items-center gap-4 text-rose-100">
            <div className="flex items-center gap-1.5">
              <MapPin className="size-3.5 text-rose-200" />
              <span>City:</span>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-transparent font-semibold text-white underline decoration-rose-300 underline-offset-2 outline-none cursor-pointer"
              >
                <option value="Bangalore" className="text-foreground">Bangalore</option>
                <option value="Mumbai" className="text-foreground">Mumbai</option>
                <option value="Delhi NCR" className="text-foreground">Delhi NCR</option>
                <option value="Hyderabad" className="text-foreground">Hyderabad</option>
                <option value="Pune" className="text-foreground">Pune</option>
              </select>
            </div>
            <a href="tel:1800123456" className="hidden md:inline hover:text-white transition">
              24/7 Helpline: 1800-SERVICE
            </a>
          </div>
        </div>
      </div>

      {/* Global Shared Header */}
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-14 sm:py-20 bg-linear-to-b from-card via-background to-background border-b border-border">
        {/* Ambient background glow accents */}
        <div className="absolute top-0 right-1/4 size-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 size-96 rounded-full bg-secondary/30 blur-3xl pointer-events-none" />

        <PageContainer maxWidth="xl" className="relative z-10 space-y-8 text-center">
          {/* Trust Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/80 text-primary border border-border shadow-xs text-xs font-semibold tracking-wide">
            <ShieldCheck className="size-4" />
            <span>₹50,000 Zero-Deductible Property Damage Guarantee</span>
          </div>

          {/* Hero Headline */}
          <div className="max-w-3xl mx-auto space-y-4">
            <WebText variant="h1" className="text-foreground">
              Book Expert Home Services in{" "}
              <span className="text-primary underline decoration-primary/30 underline-offset-8">
                60 Seconds
              </span>
            </WebText>
            <WebText variant="lead">
              Connect with background-checked plumbers, cleaners, electricians, and technicians in{" "}
              <span className="font-semibold text-foreground">{selectedCity}</span>. Transparent fixed rates, verified reviews, and instant arrival.
            </WebText>
          </div>

          {/* Quick Search & Filter Widget */}
          <div className="max-w-2xl mx-auto">
            <div className="p-3 sm:p-4 rounded-2xl bg-card border border-border shadow-lg flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 w-full">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="What service do you need? (e.g. AC Repair, Deep Cleaning)..."
                  leftIcon={<Search className="size-4" />}
                  clearable
                  onClear={() => setSearchQuery("")}
                />
              </div>
              <Button
                variant="primary"
                size="default"
                className="w-full sm:w-auto shrink-0"
                onClick={() => {
                  const target = document.getElementById("services-catalog")
                  target?.scrollIntoView({ behavior: "smooth" })
                }}
              >
                Find Pros
              </Button>
            </div>

            {/* Popular Search Tags */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
              <span className="font-medium">Trending searches:</span>
              {["AC Service", "Deep Cleaning", "Pipe Leak", "Electrician", "Wall Painting"].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSearchQuery(tag)}
                  className="px-2.5 py-1 rounded-full bg-card border border-border/80 hover:border-primary/40 hover:text-primary transition-colors text-xs"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </PageContainer>
      </section>

      {/* KPI Stats Bar */}
      <section className="py-8 bg-card border-b border-border">
        <PageContainer maxWidth="xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatisticCard
              title="Verified Bookings"
              value="45,000+"
              description="Completed in top tier cities"
              icon={<Calendar />}
            />
            <StatisticCard
              title="Certified Pros"
              value="1,200+"
              description="Rigorous ID & police verification"
              icon={<ShieldCheck />}
            />
            <StatisticCard
              title="Customer Satisfaction"
              value="4.96 ★"
              change={{ value: "98.4%", isPositive: true, label: "5-star rate" }}
              icon={<Star />}
            />
            <StatisticCard
              title="Damage Coverage"
              value="₹50,000"
              description="Zero-deductible insurance included"
              icon={<Award />}
            />
          </div>
        </PageContainer>
      </section>

      {/* Popular Categories Grid */}
      <section className="py-14 sm:py-20 bg-background">
        <PageContainer maxWidth="xl" className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-1">
                <Sparkles className="size-3.5" />
                <span>Explore Disciplines</span>
              </div>
              <WebText variant="h2">Popular Service Categories</WebText>
              <WebText variant="muted">
                Choose from verified professional specialties with upfront standard rates.
              </WebText>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/categories">View All Categories →</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CATEGORIES_LIST.map((cat) => (
              <CategoryCard
                key={cat.id}
                id={cat.id}
                name={cat.name}
                description={cat.desc}
                serviceCount={cat.count}
                icon={cat.icon}
                href={`#services-catalog`}
              />
            ))}
          </div>
        </PageContainer>
      </section>

      {/* Featured Services Catalog Section */}
      <section id="services-catalog" className="py-14 sm:py-20 bg-card border-y border-border">
        <PageContainer maxWidth="xl" className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-1">
                <Award className="size-3.5" />
                <span>Handpicked Bestsellers</span>
              </div>
              <WebText variant="h2">Featured Marketplace Services</WebText>
              <WebText variant="muted">
                Pre-screened professionals with instant scheduling and 30-day rework warranty.
              </WebText>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status="success" hasDot>
                Live Availability
              </StatusBadge>
            </div>
          </div>

          {/* Dynamic Search & Filter Bar */}
          <SearchFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={[
              { label: "Electrical & AC", value: "Electrical & AC" },
              { label: "Home Cleaning", value: "Home Cleaning" },
              { label: "Plumbing", value: "Plumbing" },
              { label: "Painting & Decor", value: "Painting & Decor" },
              { label: "Appliance Care", value: "Appliance Care" },
            ]}
            hasActiveFilters={Boolean(searchQuery || selectedCategory)}
            onResetFilters={() => {
              setSearchQuery("")
              setSelectedCategory("")
            }}
          />

          {/* Services Grid */}
          {filteredServices.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <HelpCircle className="size-10 text-muted-foreground mx-auto opacity-50" />
              <WebText variant="h4">No services match your filters</WebText>
              <WebText variant="muted">
                Try clearing your search query or selecting a different category.
              </WebText>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory("")
                }}
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((svc) => (
                <ServiceCard
                  key={svc.id}
                  id={svc.id}
                  title={svc.title}
                  description={svc.description}
                  category={svc.category}
                  price={svc.price}
                  priceType={svc.priceType}
                  rating={svc.rating}
                  reviewCount={svc.reviewCount}
                  providerName={svc.providerName}
                  durationMinutes={svc.durationMinutes}
                  onBook={() => handleBookService(svc.title)}
                />
              ))}
            </div>
          )}
        </PageContainer>
      </section>

      {/* Why Choose ServiceHub Guarantee Pillars */}
      <section className="py-14 sm:py-20 bg-background">
        <PageContainer maxWidth="xl" className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <StatusBadge status="primary" hasDot>
              The ServiceHub Promise
            </StatusBadge>
            <WebText variant="h2">Why Homeowners Trust ServiceHub</WebText>
            <WebText variant="muted">
              Built from the ground up to eliminate the uncertainty, haggling, and delays of conventional local hiring.
            </WebText>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 space-y-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
                <ShieldCheck className="size-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Verified & Certified Pros</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every service professional undergoes police verification, identity check, and hands-on skill assessment before joining.
              </p>
            </Card>

            <Card className="p-6 space-y-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
                <Award className="size-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Transparent Fixed Rates</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                No surprise fees or awkward on-site bargaining. All pricing is standardized with detailed scope of work published upfront.
              </p>
            </Card>

            <Card className="p-6 space-y-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
                <Clock className="size-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">30-Day Rework Warranty</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If the service didn&apos;t meet expectations, our warranty guarantees a free re-visit or full refund backed by ₹50,000 damage coverage.
              </p>
            </Card>
          </div>
        </PageContainer>
      </section>

      {/* How It Works 3-Step Process */}
      <section className="py-14 sm:py-20 bg-card border-t border-border">
        <PageContainer maxWidth="xl" className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <WebText variant="h2">How ServiceHub Works</WebText>
            <WebText variant="muted">
              From discovery to completion in 3 straightforward steps.
            </WebText>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="p-6 rounded-2xl bg-background border border-border space-y-3 text-center">
              <div className="flex size-12 mx-auto items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg shadow-sm">
                1
              </div>
              <h4 className="text-base font-bold text-foreground">Choose Your Service</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Select from transparent packages with clear inclusions, fixed pricing, and verified reviews.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-background border border-border space-y-3 text-center">
              <div className="flex size-12 mx-auto items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg shadow-sm">
                2
              </div>
              <h4 className="text-base font-bold text-foreground">Pick Date & Instant Time Slot</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Book in real time for same-day emergency dispatch or scheduled future maintenance.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-background border border-border space-y-3 text-center">
              <div className="flex size-12 mx-auto items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg shadow-sm">
                3
              </div>
              <h4 className="text-base font-bold text-foreground">Hassle-Free Service & Pay</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pro arrives on schedule with professional equipment. Pay securely with escrow protection.
              </p>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 bg-linear-to-r from-primary via-maroon-700 to-primary text-white">
        <PageContainer maxWidth="xl" className="text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Ready for stress-free home maintenance?
          </h2>
          <p className="text-sm sm:text-base text-rose-100/90 max-w-xl mx-auto leading-relaxed">
            Join thousands of homeowners who schedule trusted pros with zero hassle. Sign up now or explore available services.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              variant="secondary"
              size="lg"
              className="bg-white text-primary hover:bg-rose-50 font-bold shadow-md"
              asChild
            >
              <Link href="/services">Book a Service Now</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/40 text-white hover:bg-white/10 font-medium"
              asChild
            >
              <Link href="/auth/register">Create Free Account</Link>
            </Button>
          </div>
        </PageContainer>
      </section>

      {/* Global Shared Footer */}
      <Footer />
    </div>
  )
}
