"use client"

import * as React from "react"
import Link from "next/link"
import {
  Users,
  Briefcase,
  Layers,
  ShoppingBag,
  Shield,
  ChevronRight,
} from "lucide-react"

import { MarketplaceShell, ActiveFilter } from "@/components/layout/marketplace-shell"
import { StatisticCard } from "@/components/data-display/statistic-card"
import { StatusBadge } from "@/components/data-display/status-badge"
import { DataTable, DataTableColumn } from "@/components/data-display/data-table"
import { Button } from "@/components/ui/button"
import { showSuccessToast, showErrorToast } from "@/shared/ui/toast-service"
import { cn } from "@/lib/utils"


interface PendingProvider {
  id: string
  name: string
  email: string
  tradeCategory: string
  licenseNumber: string
  submittedAt: string
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED"
}

interface PlatformBooking {
  id: string
  reference: string
  customerName: string
  providerName: string
  serviceTitle: string
  date: string
  amount: number
  status: "CONFIRMED" | "PENDING" | "COMPLETED" | "CANCELLED"
}

const INITIAL_PROVIDERS_QUEUE: PendingProvider[] = [
  {
    id: "pv-1",
    name: "Alex Vance Electrical",
    email: "alex@vance-electric.com",
    tradeCategory: "Electrical works",
    licenseNumber: "LIC-EL-99421",
    submittedAt: "Oct 17, 2026, 14:30",
    status: "PENDING_REVIEW",
  },
  {
    id: "pv-2",
    name: "EcoShine Housekeeping Co.",
    email: "support@ecoshineclean.com",
    tradeCategory: "House section",
    licenseNumber: "LIC-CS-58210",
    submittedAt: "Oct 16, 2026, 09:15",
    status: "PENDING_REVIEW",
  },
  {
    id: "pv-3",
    name: "Precision Pipe Works",
    email: "contact@precisionpipes.org",
    tradeCategory: "Plumbing",
    licenseNumber: "LIC-PL-22019",
    submittedAt: "Oct 15, 2026, 16:40",
    status: "APPROVED",
  },
]

const INITIAL_PLATFORM_BOOKINGS: PlatformBooking[] = [
  {
    id: "pb-1",
    reference: "BK-8901",
    customerName: "David Miller",
    providerName: "CleanSpark Pros (Maria G.)",
    serviceTitle: "Complete Deep House Cleaning",
    date: "Oct 24, 2026",
    amount: 120.0,
    status: "CONFIRMED",
  },
  {
    id: "pb-2",
    reference: "BK-8902",
    customerName: "Jessica Lee",
    providerName: "AquaFlow Master (David C.)",
    serviceTitle: "Kitchen Sink Drainage Inspection",
    date: "Oct 25, 2026",
    amount: 85.0,
    status: "PENDING",
  },
  {
    id: "pb-3",
    reference: "BK-8899",
    customerName: "Thomas Wright",
    providerName: "VoltCraft Electric",
    serviceTitle: "Electrical Panel Diagnostic",
    date: "Oct 16, 2026",
    amount: 145.0,
    status: "COMPLETED",
  },
  {
    id: "pb-4",
    reference: "BK-8895",
    customerName: "Rachel Green",
    providerName: "Artisan Coat Pros",
    serviceTitle: "Interior Wall Painting",
    date: "Oct 14, 2026",
    amount: 210.0,
    status: "COMPLETED",
  },
]

export function AdminDashboardView() {
  const [providerQueue, setProviderQueue] = React.useState<PendingProvider[]>(INITIAL_PROVIDERS_QUEUE)
  const [bookings] = React.useState<PlatformBooking[]>(INITIAL_PLATFORM_BOOKINGS)
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [sortOption, setSortOption] = React.useState<string>("recent")

  const handleApproveProvider = (id: string, name: string) => {
    setProviderQueue((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "APPROVED" } : p))
    )
    showSuccessToast("Provider Approved", {
      description: `${name} has been verified and can now accept bookings.`,
    })
  }

  const handleRejectProvider = (id: string, name: string) => {
    setProviderQueue((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "REJECTED" } : p))
    )
    showErrorToast("Provider Rejected", {
      description: `${name} credentials did not satisfy verification requirements.`,
    })
  }

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

  const filteredQueue = React.useMemo(() => {
    return providerQueue.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          p.name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.tradeCategory.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [providerQueue, statusFilter, searchQuery])

  // Provider Queue Columns for DataTable
  const providerColumns: DataTableColumn<PendingProvider>[] = [
    {
      id: "name",
      header: "Provider Organization",
      cell: (row) => (
        <div>
          <span className="font-semibold text-[#242424] block">{row.name}</span>
          <span className="text-xs text-[#6B6B6B]">{row.email}</span>
        </div>
      ),
    },
    {
      id: "category",
      header: "Trade Category",
      cell: (row) => (
        <span className="inline-flex items-center rounded-md bg-[#F5F5F5] px-2.5 py-1 text-xs font-medium text-[#242424]">
          {row.tradeCategory}
        </span>
      ),
    },
    {
      id: "license",
      header: "License / Credential",
      cell: (row) => (
        <span className="font-mono text-xs text-[#6B6B6B]">{row.licenseNumber}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => (
        <StatusBadge
          status={
            row.status === "APPROVED"
              ? "success"
              : row.status === "PENDING_REVIEW"
              ? "warning"
              : "destructive"
          }
          hasDot
        >
          {row.status === "PENDING_REVIEW" ? "Pending Review" : row.status}
        </StatusBadge>
      ),
    },
    {
      id: "actions",
      header: "Verification Action",
      align: "right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          {row.status === "PENDING_REVIEW" ? (
            <>
              <Button
                size="sm"
                variant="primary"
                className="text-xs h-7 px-2.5"
                onClick={() => handleApproveProvider(row.id, row.name)}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 px-2.5 text-[#C74747] border-[#E5E5E5] hover:bg-[#C74747]/10"
                onClick={() => handleRejectProvider(row.id, row.name)}
              >
                Reject
              </Button>
            </>
          ) : (
            <span className="text-xs text-[#6B6B6B]">Processed</span>
          )}
        </div>
      ),
    },
  ]

  // Bookings Columns for DataTable
  const bookingColumns: DataTableColumn<PlatformBooking>[] = [
    {
      id: "reference",
      header: "Reference",
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-[#AD8066]">
          {row.reference}
        </span>
      ),
    },
    {
      id: "service",
      header: "Service & Parties",
      cell: (row) => (
        <div>
          <span className="font-semibold text-[#242424] block">{row.serviceTitle}</span>
          <span className="text-xs text-[#6B6B6B]">
            Client: {row.customerName} • Pro: {row.providerName}
          </span>
        </div>
      ),
    },
    {
      id: "date",
      header: "Date",
      accessorKey: "date",
    },
    {
      id: "amount",
      header: "Gross Total",
      cell: (row) => (
        <span className="font-bold text-[#242424]">${row.amount.toFixed(2)}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => (
        <StatusBadge
          status={
            row.status === "COMPLETED"
              ? "success"
              : row.status === "CONFIRMED"
              ? "primary"
              : row.status === "PENDING"
              ? "warning"
              : "destructive"
          }
          hasDot
        >
          {row.status}
        </StatusBadge>
      ),
    },
  ]

  // Left Admin Control Panel
  const leftFilterPanel = (
    <div className="space-y-6 text-[#242424]">
      {/* Header */}
      <div className="pb-3 border-b border-[#E5E5E5] space-y-1">
        <div className="flex items-center gap-2">
          <Shield className="size-4 text-[#AD8066]" />
          <h3 className="font-bold text-sm tracking-tight text-[#242424]">
            Admin Control Panel
          </h3>
        </div>
        <p className="text-[11px] text-[#6B6B6B]">
          System moderation, security, and verification workflows.
        </p>
      </div>

      {/* Moderation Status */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B]">
          Verification Queue
        </h4>
        <div className="space-y-1.5">
          {[
            { id: "all", label: "All Submissions", count: providerQueue.length },
            {
              id: "PENDING_REVIEW",
              label: "Pending Verification",
              count: providerQueue.filter((p) => p.status === "PENDING_REVIEW").length,
            },
            {
              id: "APPROVED",
              label: "Approved Providers",
              count: providerQueue.filter((p) => p.status === "APPROVED").length,
            },
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

      {/* Admin Modules Navigation */}
      <div className="space-y-2 pt-3 border-t border-[#E5E5E5]">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B]">
          Administration Hub
        </h4>
        <div className="space-y-1 text-xs">
          <Link
            href="/admin/users"
            className="flex items-center justify-between p-2 rounded-lg text-[#242424] hover:bg-[#F5F5F5] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Users className="size-3.5 text-[#6B6B6B]" />
              <span>Users & Accounts</span>
            </div>
            <ChevronRight className="size-3 text-[#6B6B6B]" />
          </Link>

          <Link
            href="/admin/providers"
            className="flex items-center justify-between p-2 rounded-lg text-[#242424] hover:bg-[#F5F5F5] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Briefcase className="size-3.5 text-[#6B6B6B]" />
              <span>Service Providers</span>
            </div>
            <ChevronRight className="size-3 text-[#6B6B6B]" />
          </Link>

          <Link
            href="/admin/categories"
            className="flex items-center justify-between p-2 rounded-lg text-[#242424] hover:bg-[#F5F5F5] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Layers className="size-3.5 text-[#6B6B6B]" />
              <span>Categories</span>
            </div>
            <ChevronRight className="size-3 text-[#6B6B6B]" />
          </Link>

          <Link
            href="/admin/roles"
            className="flex items-center justify-between p-2 rounded-lg text-[#242424] hover:bg-[#F5F5F5] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Shield className="size-3.5 text-[#6B6B6B]" />
              <span>Roles & Permissions</span>
            </div>
            <ChevronRight className="size-3 text-[#6B6B6B]" />
          </Link>
        </div>
      </div>
    </div>
  )

  return (
    <MarketplaceShell
      currentRole="ADMIN"
      breadcrumbs={[{ label: "Dashboard" }]}
      heading="Platform Administration & System Health"
      subheading="Oversee marketplace activity, verify service provider credentials, and audit transactions."
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search providers, users, or license numbers..."
      sortOption={sortOption}
      onSortChange={setSortOption}
      sortOptions={[
        { label: "Most Recent First", value: "recent" },
        { label: "Oldest First", value: "oldest" },
      ]}
      activeFilters={activeFilters}
      onClearAllFilters={() => {
        setStatusFilter("all")
        setSearchQuery("")
      }}
      leftPanel={leftFilterPanel}
    >
      <div className="space-y-8">
        {/* Marketplace Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatisticCard
            title="Total Platform Users"
            value="342"
            change={{ value: "+18", isPositive: true, label: "this week" }}
            icon={<Users />}
          />
          <StatisticCard
            title="Active Service Pros"
            value="48"
            change={{ value: "+4", isPositive: true, label: "verified" }}
            icon={<Briefcase />}
          />
          <StatisticCard
            title="Active Services"
            value="128"
            description="Across 9 core home trades"
            icon={<Layers />}
          />
          <StatisticCard
            title="Total Bookings"
            value="1,240"
            change={{ value: "+8%", isPositive: true, label: "MoM" }}
            icon={<ShoppingBag />}
          />
        </div>

        {/* Provider Verification Queue Section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#242424]">
                Service Provider Verification Queue ({filteredQueue.length})
              </h2>
              <p className="text-xs text-[#6B6B6B]">
                Review professional trade licenses, background clearances, and approve onboarding.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-[#E5E5E5] text-xs self-start sm:self-auto"
              asChild
            >
              <Link href="/admin/providers">View All Providers</Link>
            </Button>
          </div>

          <DataTable
            data={filteredQueue}
            columns={providerColumns}
            emptyMessage="No pending provider verifications in queue."
          />
        </section>

        {/* Recent Platform Transactions & Bookings */}
        <section className="pt-8 border-t border-[#E5E5E5] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#242424]">
                Recent Platform Bookings & Transactions
              </h2>
              <p className="text-xs text-[#6B6B6B]">
                Live stream of service appointments scheduled across all active categories.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-[#E5E5E5] text-xs self-start sm:self-auto"
              asChild
            >
              <Link href="/admin/bookings">All Transactions</Link>
            </Button>
          </div>

          <DataTable
            data={bookings}
            columns={bookingColumns}
            emptyMessage="No transactions recorded yet."
          />
        </section>
      </div>
    </MarketplaceShell>
  )
}
