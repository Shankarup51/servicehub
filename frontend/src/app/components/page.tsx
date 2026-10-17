"use client"

import * as React from "react"
import {
  Sparkles,
  Search,
  Mail,
  Shield,
  Star,
  CheckCircle2,
  Calendar,
  AlertCircle,
  HelpCircle,
  Wrench,
  Paintbrush,
  Home as HomeIcon,
  Zap,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { WebText } from "@/components/ui/web-text"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { FormField } from "@/components/forms/form-field"
import { FormActions } from "@/components/forms/form-actions"

import { Spinner } from "@/components/feedback/spinner"
import { Skeleton, SkeletonCard, SkeletonText } from "@/components/feedback/skeleton"
import { EmptyState } from "@/components/feedback/empty-state"
import { ErrorState } from "@/components/feedback/error-state"

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/overlays/dialog"
import { ConfirmationDialog } from "@/components/overlays/confirmation-dialog"
import { ResponsiveDrawer } from "@/components/overlays/responsive-drawer"
import {
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
} from "@/shared/ui/toast-service"

import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/layout/page-header"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/data-display/base-card"
import { StatusBadge } from "@/components/data-display/status-badge"
import { StatisticCard } from "@/components/data-display/statistic-card"
import { ServiceCard } from "@/components/data-display/service-card"
import { CategoryCard } from "@/components/data-display/category-card"
import { BookingCard } from "@/components/data-display/booking-card"
import { DataTable } from "@/components/data-display/data-table"
import { Pagination } from "@/components/data-display/pagination"
import { SearchFilterBar } from "@/components/data-display/search-filter-bar"
import { RichTextEditor } from "@/components/editors/rich-text-editor"
import { customerNavigation } from "@/features/navigation/navigation.data"

interface SampleBooking {
  id: string
  reference: string
  service: string
  customer: string
  date: string
  status: "CONFIRMED" | "PENDING" | "COMPLETED"
  price: number
}

const sampleBookings: SampleBooking[] = [
  {
    id: "1",
    reference: "BK-8901",
    service: "Deep House Cleaning",
    customer: "Sarah Jenkins",
    date: "Oct 24, 2026",
    status: "CONFIRMED",
    price: 120,
  },
  {
    id: "2",
    reference: "BK-8902",
    service: "Emergency Plumbing Repair",
    customer: "David Chen",
    date: "Oct 25, 2026",
    status: "PENDING",
    price: 85,
  },
  {
    id: "3",
    reference: "BK-8903",
    service: "Electrical Wiring Inspection",
    customer: "Elena Rostova",
    date: "Oct 22, 2026",
    status: "COMPLETED",
    price: 150,
  },
]

export default function ComponentShowcasePage() {
  // Overlay states
  const [modalOpen, setModalOpen] = React.useState(false)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [drawerOpen, setDrawerOpen] = React.useState(false)

  // Form states
  const [textVal, setTextVal] = React.useState("")
  const [passwordVal, setPasswordVal] = React.useState("")
  const [selectedService, setSelectedService] = React.useState("")
  const [bookingDate, setBookingDate] = React.useState("2026-10-25")
  const [agreeTerms, setAgreeTerms] = React.useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true)
  const [urgency, setUrgency] = React.useState("standard")
  const [editorHtml, setEditorHtml] = React.useState(
    "<p>Professional deep cleaning including <strong>kitchen, bathrooms, and living areas</strong>.</p>"
  )

  // Filter & Pagination states
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Header */}
      <Header />

      {/* Main Content Container */}
      <PageContainer maxWidth="xl" className="py-8">
        <PageHeader
          title="ServiceHub UI Design System"
          description="Authoritative, accessible component library crafted for ServiceHub's smart service marketplace."
          breadcrumbs={
            <Breadcrumbs
              items={[
                { label: "Design System", href: "/components" },
                { label: "Showcase" },
              ]}
            />
          }
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  showInfoToast("ServiceHub Design System", {
                    description: "Authoritative Maroon #9C1E32 palette loaded.",
                  })
                }
              >
                Show Info Toast
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  showSuccessToast("Component Library Ready!", {
                    description: "All core controls and primitives are verified.",
                  })
                }
              >
                Trigger Success
              </Button>
            </div>
          }
        />

        <div className="space-y-16">
          {/* 1. PALETTE & DESIGN TOKENS */}
          <section className="space-y-4">
            <div className="border-b border-border pb-2">
              <WebText variant="h3">1. Palette & Design Tokens</WebText>
              <WebText variant="muted">
                Mandatory color tokens matching the ServiceHub specification.
              </WebText>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <div className="p-4 rounded-xl border border-border bg-background shadow-xs text-center">
                <div className="h-10 w-full rounded-md bg-background border border-border/80 mb-2 shadow-inner" />
                <p className="text-xs font-semibold">Master BG</p>
                <code className="text-[11px] text-muted-foreground">#FCEEEF</code>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card shadow-xs text-center">
                <div className="h-10 w-full rounded-md bg-primary mb-2 shadow-xs" />
                <p className="text-xs font-semibold text-primary">Primary Action</p>
                <code className="text-[11px] text-muted-foreground">#9C1E32</code>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card shadow-xs text-center">
                <div className="h-10 w-full rounded-md bg-card border border-border mb-2" />
                <p className="text-xs font-semibold">Card Surface</p>
                <code className="text-[11px] text-muted-foreground">#FFFFFF</code>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card shadow-xs text-center">
                <div className="h-10 w-full rounded-md bg-success border border-success-foreground/30 mb-2" />
                <p className="text-xs font-semibold text-success-foreground">Success</p>
                <code className="text-[11px] text-muted-foreground">#D3F6E7</code>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card shadow-xs text-center">
                <div className="h-10 w-full rounded-md bg-warning border border-warning-foreground/30 mb-2" />
                <p className="text-xs font-semibold text-warning-foreground">Warning</p>
                <code className="text-[11px] text-muted-foreground">#FEEFD4</code>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card shadow-xs text-center">
                <div className="h-10 w-full rounded-md bg-destructive border border-destructive-foreground/30 mb-2" />
                <p className="text-xs font-semibold text-destructive-foreground">Destructive</p>
                <code className="text-[11px] text-muted-foreground">#FDE8E8</code>
              </div>
            </div>
          </section>

          {/* 2. TYPOGRAPHY (WebText) */}
          <section className="space-y-4">
            <div className="border-b border-border pb-2">
              <WebText variant="h3">2. Typography System (WebText)</WebText>
              <WebText variant="muted">
                Polymorphic semantic typography with harmonious line-heights and tracking.
              </WebText>
            </div>

            <Card className="p-6 space-y-4">
              <WebText variant="h1">Heading 1 — Marketplace Platform</WebText>
              <WebText variant="h2">Heading 2 — Verified Service Professionals</WebText>
              <WebText variant="h3">Heading 3 — Book with Instant Confirmation</WebText>
              <WebText variant="h4">Heading 4 — Category Section Header</WebText>
              <WebText variant="h5">Heading 5 — Card Header & Subsections</WebText>
              <WebText variant="lead">
                Lead paragraph text providing an engaging, high-contrast introduction to the page.
              </WebText>
              <WebText variant="body">
                Standard body typography for descriptions, terms, and detailed service information.
                Built for comfortable reading across desktop, tablet, and mobile viewport widths.
              </WebText>
              <div className="flex items-center gap-4 pt-2">
                <WebText variant="caption">Caption text for timestamps</WebText>
                <WebText variant="muted">Muted secondary text</WebText>
                <WebText variant="link">Interactive link text</WebText>
              </div>
            </Card>
          </section>

          {/* 3. BUTTONS */}
          <section className="space-y-4">
            <div className="border-b border-border pb-2">
              <WebText variant="h3">3. Buttons & Action Controls</WebText>
              <WebText variant="muted">
                Variants, sizes, loading spinners, and icon slots.
              </WebText>
            </div>

            <Card className="p-6 space-y-6">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Variants
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary">Primary Maroon</Button>
                  <Button variant="secondary">Secondary Soft</Button>
                  <Button variant="outline">Outline Border</Button>
                  <Button variant="ghost">Ghost Button</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="link">Link Style</Button>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Sizes & Icons
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm" variant="primary">
                    Small
                  </Button>
                  <Button size="default" variant="primary">
                    Default Size
                  </Button>
                  <Button size="lg" variant="primary">
                    Large CTA
                  </Button>
                  <Button
                    variant="outline"
                    leftIcon={<Calendar className="size-4" />}
                  >
                    With Left Icon
                  </Button>
                  <Button
                    variant="outline"
                    rightIcon={<Sparkles className="size-4 text-primary" />}
                  >
                    With Right Icon
                  </Button>
                  <Button variant="outline" size="icon" aria-label="Search">
                    <Search className="size-4" />
                  </Button>
                  <Button variant="primary" isLoading>
                    Processing
                  </Button>
                </div>
              </div>
            </Card>
          </section>

          {/* 4. FORM PRIMITIVES & WRAPPERS */}
          <section className="space-y-4">
            <div className="border-b border-border pb-2">
              <WebText variant="h3">4. Form Primitives & Validation</WebText>
              <WebText variant="muted">
                Inputs, password eye toggle, select, datepicker, checkboxes, switches, and field wrappers.
              </WebText>
            </div>

            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Full Name"
                  required
                  hint="Enter your legal first and last name"
                >
                  <Input
                    placeholder="e.g. John Doe"
                    value={textVal}
                    onChange={(e) => setTextVal(e.target.value)}
                  />
                </FormField>

                <FormField
                  label="Email Address"
                  required
                  hint="We will send booking confirmations here"
                >
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    leftIcon={<Mail className="size-4" />}
                  />
                </FormField>

                <FormField
                  label="Account Password"
                  required
                  hint="Password input includes built-in show/hide eye toggle"
                >
                  <Input
                    type="password"
                    placeholder="Enter secure password"
                    value={passwordVal}
                    onChange={(e) => setPasswordVal(e.target.value)}
                  />
                </FormField>

                <FormField
                  label="Input with Error State"
                  error="This email address is already registered."
                >
                  <Input
                    defaultValue="taken@servicehub.com"
                    error="This email address is already registered."
                  />
                </FormField>

                <FormField
                  label="Select Service Category"
                  required
                  hint="Choose the main service domain"
                >
                  <Select
                    value={selectedService}
                    onValueChange={setSelectedService}
                    placeholder="Choose category..."
                    options={[
                      { label: "Home Cleaning & Maid Services", value: "cleaning" },
                      { label: "Plumbing Repairs & Drainage", value: "plumbing" },
                      { label: "Electrical Installation", value: "electrical" },
                      { label: "Painting & Wallpapering", value: "painting" },
                    ]}
                  />
                </FormField>

                <FormField
                  label="Preferred Booking Date"
                  required
                  hint="Select appointment date"
                >
                  <DatePicker
                    value={bookingDate}
                    onChange={setBookingDate}
                    min="2026-10-17"
                  />
                </FormField>
              </div>

              <div className="mt-6 pt-6 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <FormField label="Selection Controls">
                    <div className="space-y-3 pt-1">
                      <Checkbox
                        checked={agreeTerms}
                        onCheckedChange={(checked) => setAgreeTerms(!!checked)}
                        label="I agree to the Terms of Service and Privacy Policy"
                        description="Your booking is backed by our ServiceHub 100% satisfaction guarantee."
                      />
                      <Switch
                        checked={notificationsEnabled}
                        onCheckedChange={setNotificationsEnabled}
                        label="SMS & Email Status Updates"
                        description="Receive real-time notifications when the provider accepts and arrives."
                      />
                    </div>
                  </FormField>
                </div>

                <div>
                  <FormField label="Service Urgency (Radio Group)">
                    <RadioGroup
                      value={urgency}
                      onValueChange={setUrgency}
                      className="pt-1"
                    >
                      <RadioGroupItem
                        value="standard"
                        label="Standard Appointment"
                        description="Scheduled in advance for regular service hours."
                      />
                      <RadioGroupItem
                        value="urgent"
                        label="Urgent Service (Same Day)"
                        description="Dispatched within 2 hours subject to pro availability."
                      />
                    </RadioGroup>
                  </FormField>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <FormField
                  label="Special Instructions / Service Details"
                  hint="Provide gate codes, pet alerts, or specific requests"
                >
                  <Textarea
                    placeholder="e.g. Please bring eco-friendly cleaning supplies and ring the bell upon arrival."
                    showCount
                    maxLength={250}
                  />
                </FormField>
              </div>

              <FormActions align="right" className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setTextVal("")
                    setPasswordVal("")
                    setSelectedService("")
                    setBookingDate("")
                    setAgreeTerms(false)
                    setNotificationsEnabled(false)
                    setUrgency("standard")
                  }}
                >
                  Reset Form
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setTextVal("")
                    setPasswordVal("")
                    setSelectedService("")
                    setBookingDate("")
                    setAgreeTerms(false)
                    setNotificationsEnabled(false)
                    setUrgency("standard")
                    showSuccessToast("Form Submitted & Cleared", {
                      description: "All form inputs have been cleared after submission.",
                    })
                  }}
                >
                  Save Changes
                </Button>
              </FormActions>
            </Card>
          </section>

          {/* 5. FEEDBACK & SKELETONS */}
          <section className="space-y-4">
            <div className="border-b border-border pb-2">
              <WebText variant="h3">5. Feedback & Loading States</WebText>
              <WebText variant="muted">
                Spinners, pulse skeletons, empty states, and error alerts.
              </WebText>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Spinners & Pulse Skeletons
                </p>
                <div className="flex items-center gap-6">
                  <Spinner size="sm" />
                  <Spinner size="default" />
                  <Spinner size="lg" />
                  <Spinner size="xl" label="Loading services..." />
                </div>
                <div className="pt-4 border-t border-border space-y-3">
                  <SkeletonText lines={2} />
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-28 rounded-lg" />
                    <Skeleton className="h-10 w-28 rounded-lg" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <EmptyState
                  title="No Bookings Found"
                  description="You do not have any active appointments for this time range."
                  action={
                    <Button variant="primary" size="sm">
                      Explore Services
                    </Button>
                  }
                />
              </Card>
            </div>

            <ErrorState
              title="Failed to Load Service Schedule"
              message="The booking engine could not fetch available time slots from the calendar."
              details="Error: 503 SERVICE_UNAVAILABLE from ProviderGateway (timeout 5000ms)"
              onRetry={() =>
                showInfoToast("Retrying...", {
                  description: "Refetching calendar slots.",
                })
              }
            />
          </section>

          {/* 6. OVERLAYS & TOASTS */}
          <section className="space-y-4">
            <div className="border-b border-border pb-2">
              <WebText variant="h3">6. Overlays, Dialogs & Toast Notifications</WebText>
              <WebText variant="muted">
                Accessible Radix modals, confirmation dialogs, drawers, and Sonner alerts.
              </WebText>
            </div>

            <Card className="p-6 space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" onClick={() => setModalOpen(true)}>
                  Open Standard Dialog
                </Button>
                <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
                  Open Confirmation Dialog
                </Button>
                <Button variant="outline" onClick={() => setDrawerOpen(true)}>
                  Open Side Drawer
                </Button>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Toast Notifications
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      showSuccessToast("Booking Confirmed!", {
                        description: "Your appointment #BK-8901 is confirmed.",
                      })
                    }
                  >
                    Success Toast
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      showErrorToast("Payment Failed", {
                        description: "Card was declined. Please try another method.",
                      })
                    }
                  >
                    Error Toast
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      showWarningToast("Booking Expiring", {
                        description: "Provider hold expires in 10 minutes.",
                      })
                    }
                  >
                    Warning Toast
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      showInfoToast("New Message", {
                        description: "Service Provider: 'I am on my way.'",
                      })
                    }
                  >
                    Info Toast
                  </Button>
                </div>
              </div>
            </Card>

            {/* Standard Dialog */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Service Booking Details</DialogTitle>
                  <DialogDescription>
                    Review the service parameters and price breakdown before confirming.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-2 space-y-3 text-sm">
                  <div className="flex justify-between py-1 border-b border-border">
                    <span className="text-muted-foreground">Service:</span>
                    <span className="font-semibold">Deep House Cleaning (3 Rooms)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border">
                    <span className="text-muted-foreground">Estimated Duration:</span>
                    <span className="font-semibold">2.5 Hours</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border">
                    <span className="text-muted-foreground">Total Price:</span>
                    <span className="font-bold text-primary">$120.00</span>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setModalOpen(false)}>
                    Close
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setModalOpen(false)
                      showSuccessToast("Confirmed in Dialog!")
                    }}
                  >
                    Proceed to Payment
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Confirmation Dialog */}
            <ConfirmationDialog
              open={confirmOpen}
              onOpenChange={setConfirmOpen}
              title="Cancel Booking #BK-8901?"
              description="Are you sure you want to cancel this booking? If cancelled within 2 hours of scheduled time, a cancellation fee may apply."
              confirmLabel="Yes, Cancel Booking"
              variant="destructive"
              onConfirm={() => {
                setConfirmOpen(false)
                showErrorToast("Booking #BK-8901 has been cancelled.")
              }}
            />

            {/* Responsive Side Drawer */}
            <ResponsiveDrawer
              open={drawerOpen}
              onOpenChange={setDrawerOpen}
              title="Filter Services"
              description="Refine marketplace results by price and rating"
              side="right"
              footer={
                <>
                  <Button variant="outline" onClick={() => setDrawerOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setDrawerOpen(false)
                      showSuccessToast("Filters applied!")
                    }}
                  >
                    Apply Filters
                  </Button>
                </>
              }
            >
              <div className="space-y-4 py-2">
                <FormField label="Price Range">
                  <Select
                    defaultValue="all"
                    options={[
                      { label: "All Prices", value: "all" },
                      { label: "Under $50", value: "under-50" },
                      { label: "$50 to $100", value: "50-100" },
                      { label: "$100+", value: "100-plus" },
                    ]}
                  />
                </FormField>
                <FormField label="Minimum Rating">
                  <Select
                    defaultValue="4.5"
                    options={[
                      { label: "4.5 Stars & above", value: "4.5" },
                      { label: "4.0 Stars & above", value: "4.0" },
                      { label: "Any Rating", value: "any" },
                    ]}
                  />
                </FormField>
              </div>
            </ResponsiveDrawer>
          </section>

          {/* 7. DATA DISPLAY & CARDS */}
          <section className="space-y-6">
            <div className="border-b border-border pb-2">
              <WebText variant="h3">7. Data Display, Badges & Cards</WebText>
              <WebText variant="muted">
                Status badges, statistic KPIs, marketplace service cards, category cards, and booking cards.
              </WebText>
            </div>

            {/* Status Badges */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Status Badges
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status="success" hasDot>
                  CONFIRMED
                </StatusBadge>
                <StatusBadge status="warning" hasDot>
                  PENDING REVIEW
                </StatusBadge>
                <StatusBadge status="processing" hasDot>
                  IN PROGRESS
                </StatusBadge>
                <StatusBadge status="destructive" hasDot>
                  CANCELLED
                </StatusBadge>
                <StatusBadge status="primary" hasDot>
                  FEATURED PRO
                </StatusBadge>
                <StatusBadge status="neutral">
                  DRAFT
                </StatusBadge>
              </div>
            </div>

            {/* Statistic KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatisticCard
                title="Total Bookings"
                value="1,428"
                change={{ value: "+12.4%", isPositive: true, label: "vs last month" }}
                icon={<Calendar />}
              />
              <StatisticCard
                title="Active Providers"
                value="342"
                change={{ value: "+8.1%", isPositive: true, label: "this quarter" }}
                icon={<Shield />}
              />
              <StatisticCard
                title="Average Rating"
                value="4.92"
                change={{ value: "+0.2", isPositive: true, label: "from 8.2k reviews" }}
                icon={<Star />}
              />
              <StatisticCard
                title="Dispute Rate"
                value="0.3%"
                change={{ value: "-0.5%", isPositive: true, label: "down 50%" }}
                icon={<CheckCircle2 />}
              />
            </div>

            {/* Category Cards */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Category Cards
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <CategoryCard
                  id="cleaning"
                  name="Home Cleaning"
                  description="Thorough residential and deep apartment sanitization"
                  serviceCount={24}
                  icon={<HomeIcon />}
                />
                <CategoryCard
                  id="plumbing"
                  name="Plumbing & Pipes"
                  description="Clog clearing, pipe repairs, and faucet fixtures"
                  serviceCount={18}
                  icon={<Wrench />}
                />
                <CategoryCard
                  id="electrical"
                  name="Electrical & Wiring"
                  description="Licensed electricians for panel upgrades and repairs"
                  serviceCount={15}
                  icon={<Zap />}
                />
                <CategoryCard
                  id="painting"
                  name="Painting & Decor"
                  description="Interior and exterior residential wall coatings"
                  serviceCount={12}
                  icon={<Paintbrush />}
                />
              </div>
            </div>

            {/* Service Marketplace Cards */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Service Cards
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <ServiceCard
                  id="srv-1"
                  title="Premium Full Home Deep Cleaning"
                  description="Comprehensive sanitation of kitchen, bathrooms, floors, and windows with non-toxic supplies."
                  category="Cleaning"
                  price={45}
                  priceType="HOURLY"
                  rating={4.9}
                  reviewCount={64}
                  providerName="CleanSpark Pros"
                  durationMinutes={180}
                  onBook={() =>
                    showSuccessToast("Service Selected", {
                      description: "Proceeding to schedule CleanSpark Pros.",
                    })
                  }
                />
                <ServiceCard
                  id="srv-2"
                  title="Emergency Pipe Leak Detection & Repair"
                  description="Rapid response diagnostic and pipe fixing service for residential burst or leaking water lines."
                  category="Plumbing"
                  price={85}
                  priceType="FIXED"
                  rating={4.8}
                  reviewCount={41}
                  providerName="AquaFlow Master"
                  durationMinutes={60}
                  onBook={() =>
                    showSuccessToast("Service Selected", {
                      description: "Proceeding to schedule AquaFlow Master.",
                    })
                  }
                />
                <ServiceCard
                  id="srv-3"
                  title="Ceiling Fan & Light Fixture Installation"
                  description="Safe electrical wiring and secure mounting of chandeliers, ceiling fans, and smart dimmers."
                  category="Electrical"
                  price={65}
                  priceType="HOURLY"
                  rating={5.0}
                  reviewCount={29}
                  providerName="VoltCraft Electric"
                  durationMinutes={90}
                  onBook={() =>
                    showSuccessToast("Service Selected", {
                      description: "Proceeding to schedule VoltCraft Electric.",
                    })
                  }
                />
              </div>
            </div>

            {/* Booking Cards */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Booking Summary Cards
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BookingCard
                  id="bk-1"
                  bookingReference="BK-9842"
                  serviceTitle="Complete Apartment Deep Clean"
                  partyName="CleanSpark Pros"
                  partyRole="Provider"
                  status="CONFIRMED"
                  scheduledDate="Saturday, Oct 24, 2026"
                  scheduledTime="10:00 AM - 1:00 PM"
                  address="742 Evergreen Terrace, Springfield"
                  totalAmount={135.0}
                  onReschedule={() => showInfoToast("Reschedule Requested")}
                />
                <BookingCard
                  id="bk-2"
                  bookingReference="BK-9843"
                  serviceTitle="Kitchen Sink Drainage Clearing"
                  partyName="David Chen (Customer)"
                  partyRole="Customer"
                  status="PENDING"
                  scheduledDate="Sunday, Oct 25, 2026"
                  scheduledTime="2:00 PM - 3:30 PM"
                  address="108 Ocean Drive, Suite 4B"
                  totalAmount={85.0}
                  onCancel={() => setConfirmOpen(true)}
                />
              </div>
            </div>

            {/* Search Filter Bar */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Search & Filter Bar
              </p>
              <SearchFilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                categories={[
                  { label: "Home Cleaning", value: "cleaning" },
                  { label: "Plumbing", value: "plumbing" },
                  { label: "Electrical", value: "electrical" },
                  { label: "Painting", value: "painting" },
                ]}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                sortOptions={[
                  { label: "Highest Rated", value: "rating-desc" },
                  { label: "Price: Low to High", value: "price-asc" },
                  { label: "Price: High to Low", value: "price-desc" },
                ]}
                hasActiveFilters={Boolean(searchQuery || selectedCategory)}
                onResetFilters={() => {
                  setSearchQuery("")
                  setSelectedCategory("")
                }}
              />
            </div>

            {/* Data Table & Pagination */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Data Table with Pagination
              </p>
              <DataTable<SampleBooking>
                data={sampleBookings}
                columns={[
                  {
                    id: "reference",
                    header: "Ref Code",
                    accessorKey: "reference",
                    className: "font-mono font-medium text-xs",
                  },
                  {
                    id: "service",
                    header: "Service",
                    accessorKey: "service",
                    className: "font-semibold",
                  },
                  {
                    id: "customer",
                    header: "Customer",
                    accessorKey: "customer",
                  },
                  {
                    id: "date",
                    header: "Scheduled Date",
                    accessorKey: "date",
                  },
                  {
                    id: "price",
                    header: "Price",
                    align: "right",
                    cell: (row) => (
                      <span className="font-bold text-foreground">
                        ${row.price.toFixed(2)}
                      </span>
                    ),
                  },
                  {
                    id: "status",
                    header: "Status",
                    align: "center",
                    cell: (row) => {
                      const statusKind =
                        row.status === "CONFIRMED"
                          ? "success"
                          : row.status === "PENDING"
                          ? "warning"
                          : "processing"
                      return (
                        <StatusBadge status={statusKind} hasDot>
                          {row.status}
                        </StatusBadge>
                      )
                    },
                  },
                ]}
              />
              <Pagination
                currentPage={currentPage}
                totalPages={4}
                totalItems={36}
                pageSize={10}
                onPageChange={setCurrentPage}
              />
            </div>
          </section>

          {/* 8. RICH TEXT EDITOR */}
          <section className="space-y-4">
            <div className="border-b border-border pb-2">
              <WebText variant="h3">8. Rich Text Editor</WebText>
              <WebText variant="muted">
                SSR-safe editor with formatting toolbar (headings, bold, lists, links, undo/redo).
              </WebText>
            </div>

            <Card className="p-6">
              <FormField
                label="Detailed Scope of Work"
                hint="Describe what is included and excluded in the service package"
              >
                <RichTextEditor
                  value={editorHtml}
                  onChange={setEditorHtml}
                  minHeight="140px"
                />
              </FormField>
            </Card>
          </section>

          {/* 9. SIDEBAR PREVIEW */}
          <section className="space-y-4">
            <div className="border-b border-border pb-2">
              <WebText variant="h3">9. Portal Sidebar Layout</WebText>
              <WebText variant="muted">
                Collapsible sidebar for Customer, Provider, or Admin dashboard portals.
              </WebText>
            </div>

            <Card className="p-0 overflow-hidden border border-border">
              <div className="flex h-96 w-full">
                <Sidebar
                  sections={customerNavigation}
                  user={{
                    name: "Alex Morgan",
                    email: "alex@servicehub.com",
                    role: "Customer",
                  }}
                  onLogout={() => showInfoToast("Logout action triggered")}
                />
                <div className="flex-1 p-6 bg-background/50 overflow-y-auto">
                  <h4 className="text-lg font-bold text-foreground mb-1">
                    Customer Portal Workspace
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Sidebar toggles between expanded (256px) and icon-collapsed (64px) view.
                  </p>
                  <SkeletonCard />
                </div>
              </div>
            </Card>
          </section>
        </div>
      </PageContainer>

      {/* Footer */}
      <Footer />
    </div>
  )
}
