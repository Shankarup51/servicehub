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
import { Pagination } from "@/components/data-display/pagination"
import { Button } from "@/components/ui/button"
import { showSuccessToast, showErrorToast } from "@/shared/ui/toast-service"
import { cn } from "@/lib/utils"
import {
  useAdminListVerificationsQuery,
  useAdminApproveVerificationMutation,
  useAdminRejectVerificationMutation,
} from "@/features/providers/providers.api"
import type { AdminVerificationListItem } from "@/features/providers/providers.types"

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

function formatDateFriendly(isoString: string | null | undefined): string {
  if (!isoString) return "N/A"
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  } catch {
    return isoString
  }
}

export function AdminDashboardView() {
  const [bookings] = React.useState<PlatformBooking[]>(INITIAL_PLATFORM_BOOKINGS)
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [debouncedSearch, setDebouncedSearch] = React.useState<string>("")
  const [sortOption, setSortOption] = React.useState<string>("recent")
  const [page, setPage] = React.useState(1)

  // Debounce search input by 300ms
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchQuery.trim()
      setDebouncedSearch((prev) => {
        if (prev !== trimmed) {
          setPage(1)
        }
        return trimmed
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Derive sort parameters for server-side query
  const sortConfig = React.useMemo<{
    sortBy?: "submittedAt" | "createdAt" | "id"
    sortOrder?: "asc" | "desc"
  }>(() => {
    switch (sortOption) {
      case "oldest":
        return { sortBy: "submittedAt", sortOrder: "asc" }
      case "recent":
      default:
        return { sortBy: "submittedAt", sortOrder: "desc" }
    }
  }, [sortOption])

  // Map status filter to backend VerificationStatus
  const statusParam = React.useMemo(() => {
    if (statusFilter === "PENDING_REVIEW") return "PENDING"
    if (statusFilter === "APPROVED") return "APPROVED"
    if (statusFilter === "REJECTED") return "REJECTED"
    return undefined
  }, [statusFilter])

  // Server-side verifications query
  const {
    data: verificationsData,
    isLoading: isVerificationsLoading,
    refetch: refetchVerifications,
  } = useAdminListVerificationsQuery({
    page,
    limit: 10,
    status: statusParam,
    search: debouncedSearch || undefined,
    sortBy: sortConfig.sortBy,
    sortOrder: sortConfig.sortOrder,
  })

  // Reliable global counts for sidebar tabs
  const { data: allCountData } = useAdminListVerificationsQuery({ limit: 1 })
  const { data: pendingCountData } = useAdminListVerificationsQuery({ status: "PENDING", limit: 1 })
  const { data: approvedCountData } = useAdminListVerificationsQuery({ status: "APPROVED", limit: 1 })

  const totalAllCount = allCountData?.total ?? 0
  const pendingCount = pendingCountData?.total ?? 0
  const approvedCount = approvedCountData?.total ?? 0

  const [approveVerification, { isLoading: isApproving }] = useAdminApproveVerificationMutation()
  const [rejectVerification, { isLoading: isRejecting }] = useAdminRejectVerificationMutation()

  const handleApproveProvider = async (id: number, name: string) => {
    try {
      await approveVerification(id).unwrap()
      showSuccessToast("Provider Approved", {
        description: `${name} has been verified and can now accept bookings.`,
      })
      refetchVerifications()
    } catch {
      showErrorToast("Approval Failed", {
        description: "Failed to approve provider verification.",
      })
    }
  }

  const handleRejectProvider = async (id: number, name: string) => {
    try {
      await rejectVerification({
        id,
        data: { rejectionReason: "Credentials did not satisfy verification requirements." },
      }).unwrap()
      showErrorToast("Provider Rejected", {
        description: `${name} verification was rejected.`,
      })
      refetchVerifications()
    } catch {
      showErrorToast("Rejection Failed", {
        description: "Failed to reject provider verification.",
      })
    }
  }

  const activeFilters = React.useMemo<ActiveFilter[]>(() => {
    const list: ActiveFilter[] = []
    if (statusFilter !== "all") {
      list.push({
        id: "status",
        label: `Status: ${statusFilter === "PENDING_REVIEW" ? "Pending Verification" : statusFilter}`,
        onRemove: () => {
          setStatusFilter("all")
          setPage(1)
        },
      })
    }
    if (debouncedSearch) {
      list.push({
        id: "query",
        label: `"${debouncedSearch}"`,
        onRemove: () => {
          setSearchQuery("")
          setPage(1)
        },
      })
    }
    return list
  }, [statusFilter, debouncedSearch])

  // Provider Queue Columns for DataTable
  const providerColumns: DataTableColumn<AdminVerificationListItem>[] = [
    {
      id: "name",
      header: "Provider Organization",
      cell: (row) => {
        const displayName = row.provider?.displayName || `Provider #${row.providerId}`
        const userName = `${row.provider?.user?.firstName || ""} ${row.provider?.user?.lastName || ""}`.trim()
        const email = row.provider?.user?.email || "No email"
        return (
          <div>
            <span className="font-semibold text-[#242424] dark:text-foreground block">{displayName}</span>
            <span className="text-xs text-[#6B6B6B] dark:text-muted-foreground">{userName ? `${userName} • ${email}` : email}</span>
          </div>
        )
      },
    },
    {
      id: "documents",
      header: "Documents",
      cell: (row) => (
        <span className="inline-flex items-center rounded-md bg-[#F5F5F5] dark:bg-muted px-2.5 py-1 text-xs font-medium text-[#242424] dark:text-foreground">
          {row.documentCount} document{row.documentCount === 1 ? "" : "s"} submitted
        </span>
      ),
    },
    {
      id: "reference",
      header: "Verification ID",
      cell: (row) => (
        <span className="font-mono text-xs text-[#6B6B6B] dark:text-muted-foreground">#VER-{row.id}</span>
      ),
    },
    {
      id: "submittedAt",
      header: "Submitted",
      cell: (row) => (
        <span className="text-xs text-[#6B6B6B] dark:text-muted-foreground">
          {formatDateFriendly(row.submittedAt || row.createdAt)}
        </span>
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
              : row.status === "PENDING"
              ? "warning"
              : "destructive"
          }
          hasDot
        >
          {row.status === "PENDING" ? "Pending Review" : row.status}
        </StatusBadge>
      ),
    },
    {
      id: "actions",
      header: "Verification Action",
      align: "right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          {row.status === "PENDING" ? (
            <>
              <Button
                size="sm"
                variant="primary"
                className="text-xs h-7 px-2.5"
                disabled={isApproving || isRejecting}
                onClick={() =>
                  handleApproveProvider(
                    row.id,
                    row.provider?.displayName || `Provider #${row.providerId}`
                  )
                }
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 px-2.5 text-[#C74747] border-[#E5E5E5] hover:bg-[#C74747]/10"
                disabled={isApproving || isRejecting}
                onClick={() =>
                  handleRejectProvider(
                    row.id,
                    row.provider?.displayName || `Provider #${row.providerId}`
                  )
                }
              >
                Reject
              </Button>
            </>
          ) : (
            <span className="text-xs text-[#6B6B6B] dark:text-muted-foreground">Processed</span>
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
            { id: "all", label: "All Submissions", count: totalAllCount },
            {
              id: "PENDING_REVIEW",
              label: "Pending Verification",
              count: pendingCount,
            },
            {
              id: "APPROVED",
              label: "Approved Providers",
              count: approvedCount,
            },
          ].map((item) => {
            const isSelected = statusFilter === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setStatusFilter(item.id)
                  setPage(1)
                }}
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

  const verificationItems = verificationsData?.items || []
  const totalItems = verificationsData?.total || 0
  const totalPages = verificationsData?.totalPages || 1

  return (
    <MarketplaceShell
      currentRole="ADMIN"
      breadcrumbs={[{ label: "Dashboard" }]}
      heading="Platform Administration & System Health"
      subheading="Oversee marketplace activity, verify service provider credentials, and audit transactions."
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search providers, users, or verification IDs..."
      sortOption={sortOption}
      onSortChange={(val) => {
        setSortOption(val)
        setPage(1)
      }}
      sortOptions={[
        { label: "Most Recent First", value: "recent" },
        { label: "Oldest First", value: "oldest" },
      ]}
      activeFilters={activeFilters}
      onClearAllFilters={() => {
        setStatusFilter("all")
        setSearchQuery("")
        setSortOption("recent")
        setPage(1)
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
            gradient="blue"
          />
          <StatisticCard
            title="Active Service Pros"
            value="48"
            change={{ value: "+4", isPositive: true, label: "verified" }}
            icon={<Briefcase />}
            gradient="emerald"
          />
          <StatisticCard
            title="Active Services"
            value="128"
            description="Across 9 core home trades"
            icon={<Layers />}
            gradient="purple"
          />
          <StatisticCard
            title="Total Bookings"
            value="1,240"
            change={{ value: "+8%", isPositive: true, label: "MoM" }}
            icon={<ShoppingBag />}
            gradient="amber"
          />
        </div>

        {/* Provider Verification Queue Section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#242424] dark:text-foreground">
                Service Provider Verification Queue ({totalItems})
              </h2>
              <p className="text-xs text-[#6B6B6B] dark:text-muted-foreground">
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
            data={verificationItems}
            columns={providerColumns}
            isLoading={isVerificationsLoading}
            emptyMessage={
              statusFilter !== "all" || debouncedSearch
                ? "No provider verifications match the current filter or search criteria."
                : "No pending provider verifications in queue."
            }
          />

          {totalPages > 1 && (
            <div className="pt-2">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={10}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </section>

        {/* Recent Platform Transactions & Bookings */}
        <section className="pt-8 border-t border-[#E5E5E5] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#242424] dark:text-foreground">
                Recent Platform Bookings & Transactions
              </h2>
              <p className="text-xs text-[#6B6B6B] dark:text-muted-foreground">
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
