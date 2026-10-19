"use client"

import * as React from "react"
import {
  Filter,
  RotateCcw,
  Search,
  Sparkles,
  Tag,
  DollarSign,
} from "lucide-react"

import { MarketplaceShell, type ActiveFilter } from "@/components/layout/marketplace-shell"
import { ServiceCard } from "@/components/data-display/service-card"
import { Pagination } from "@/components/data-display/pagination"
import { EmptyState } from "@/components/feedback/empty-state"
import { ErrorState } from "@/components/feedback/error-state"
import { Skeleton, SkeletonCard } from "@/components/feedback/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useGetServicesQuery } from "@/features/services/services.api"
import { useGetCategoriesQuery } from "@/features/categories/categories.api"
import type { CategoryTreeItem } from "@/features/categories/categories.types"
import { cn } from "@/lib/utils"

const ITEMS_PER_PAGE = 12

// Flatten hierarchical category tree for filter sidebar
interface FlatCategory {
  id: number
  name: string
  level: number
}

function flattenCategoryTree(nodes: CategoryTreeItem[], level = 0): FlatCategory[] {
  const result: FlatCategory[] = []
  for (const node of nodes) {
    result.push({ id: node.id, name: node.name, level })
    if (node.children && node.children.length > 0) {
      result.push(...flattenCategoryTree(node.children, level + 1))
    }
  }
  return result
}

// Quick price presets
const PRICE_PRESETS = [
  { label: "All Prices", min: undefined, max: undefined },
  { label: "Under $50", min: undefined, max: 50 },
  { label: "$50 to $100", min: 50, max: 100 },
  { label: "$100 to $200", min: 100, max: 200 },
  { label: "$200 & Above", min: 200, max: undefined },
]

const SERVICE_SORT_OPTIONS = [
  { label: "Newest First", value: "newest" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Name: A to Z", value: "name-asc" },
  { label: "Name: Z to A", value: "name-desc" },
  { label: "Duration: Shortest", value: "duration-asc" },
]

export default function ServicesListingPage() {
  // Filter States
  const [searchInput, setSearchInput] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string>("all")
  const [minPriceInput, setMinPriceInput] = React.useState("")
  const [maxPriceInput, setMaxPriceInput] = React.useState("")
  const [appliedMinPrice, setAppliedMinPrice] = React.useState<number | undefined>(undefined)
  const [appliedMaxPrice, setAppliedMaxPrice] = React.useState<number | undefined>(undefined)
  const [priceError, setPriceError] = React.useState<string | null>(null)
  const [sortOption, setSortOption] = React.useState("newest")
  const [page, setPage] = React.useState(1)

  // Debounce search input by 300ms to avoid unnecessary API requests on every keystroke
  React.useEffect(() => {
    const handler = setTimeout(() => {
      const trimmed = searchInput.trim()
      setDebouncedSearch((prev) => {
        if (prev !== trimmed) {
          setPage(1)
        }
        return trimmed
      })
    }, 300)
    return () => clearTimeout(handler)
  }, [searchInput])

  // Derive sortBy and sortOrder for server-side query
  const { sortBy, sortOrder } = React.useMemo<{
    sortBy?: "createdAt" | "price" | "name" | "durationMinutes"
    sortOrder?: "asc" | "desc"
  }>(() => {
    switch (sortOption) {
      case "price-asc":
        return { sortBy: "price", sortOrder: "asc" }
      case "price-desc":
        return { sortBy: "price", sortOrder: "desc" }
      case "name-asc":
        return { sortBy: "name", sortOrder: "asc" }
      case "name-desc":
        return { sortBy: "name", sortOrder: "desc" }
      case "duration-asc":
        return { sortBy: "durationMinutes", sortOrder: "asc" }
      case "newest":
      default:
        return { sortBy: "createdAt", sortOrder: "desc" }
    }
  }, [sortOption])

  // Fetch active categories for the filter sidebar
  const {
    data: categoryTree = [],
    isLoading: isCategoriesLoading,
  } = useGetCategoriesQuery()

  const flatCategories = React.useMemo(() => {
    return flattenCategoryTree(categoryTree)
  }, [categoryTree])

  // Fetch live services using RTK Query
  const categoryIdParam =
    selectedCategoryId !== "all" ? Number(selectedCategoryId) : undefined

  const {
    data: servicesResponse,
    isLoading: isServicesLoading,
    isFetching: isServicesFetching,
    isError: isServicesError,
    error: servicesError,
    refetch,
  } = useGetServicesQuery({
    page,
    limit: ITEMS_PER_PAGE,
    categoryId: categoryIdParam,
    search: debouncedSearch || undefined,
    minPrice: appliedMinPrice,
    maxPrice: appliedMaxPrice,
    sortBy,
    sortOrder,
  })

  const services = servicesResponse?.data || []
  const meta = servicesResponse?.meta || {
    total: 0,
    page: 1,
    limit: ITEMS_PER_PAGE,
    totalPages: 1,
  }

  // Handle Category selection
  const handleSelectCategory = (catIdStr: string) => {
    setSelectedCategoryId(catIdStr)
    setPage(1)
  }

  // Handle manual price filter apply
  const handleApplyPrice = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setPriceError(null)

    const min = minPriceInput.trim() !== "" ? Number(minPriceInput) : undefined
    const max = maxPriceInput.trim() !== "" ? Number(maxPriceInput) : undefined

    if (min !== undefined && (isNaN(min) || min < 0)) {
      setPriceError("Min price must be a valid positive number.")
      return
    }
    if (max !== undefined && (isNaN(max) || max < 0)) {
      setPriceError("Max price must be a valid positive number.")
      return
    }
    if (min !== undefined && max !== undefined && min > max) {
      setPriceError("Min price cannot be greater than Max price.")
      return
    }

    setAppliedMinPrice(min)
    setAppliedMaxPrice(max)
    setPage(1)
  }

  // Handle price preset click
  const handleSelectPricePreset = (min?: number, max?: number) => {
    setMinPriceInput(min !== undefined ? String(min) : "")
    setMaxPriceInput(max !== undefined ? String(max) : "")
    setAppliedMinPrice(min)
    setAppliedMaxPrice(max)
    setPriceError(null)
    setPage(1)
  }

  // Reset all filters
  const handleClearAllFilters = () => {
    setSelectedCategoryId("all")
    setMinPriceInput("")
    setMaxPriceInput("")
    setAppliedMinPrice(undefined)
    setAppliedMaxPrice(undefined)
    setPriceError(null)
    setSearchInput("")
    setSortOption("newest")
    setPage(1)
  }

  // Handle pagination change
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  // Active filter chips displayed in MarketplaceShell
  const activeFilters: ActiveFilter[] = React.useMemo(() => {
    const list: ActiveFilter[] = []

    if (selectedCategoryId !== "all") {
      const cat = flatCategories.find((c) => String(c.id) === selectedCategoryId)
      list.push({
        id: "category",
        label: `Category: ${cat ? cat.name : selectedCategoryId}`,
        onRemove: () => {
          setSelectedCategoryId("all")
          setPage(1)
        },
      })
    }

    if (appliedMinPrice !== undefined) {
      list.push({
        id: "minPrice",
        label: `Min: $${appliedMinPrice}`,
        onRemove: () => {
          setMinPriceInput("")
          setAppliedMinPrice(undefined)
          setPage(1)
        },
      })
    }

    if (appliedMaxPrice !== undefined) {
      list.push({
        id: "maxPrice",
        label: `Max: $${appliedMaxPrice}`,
        onRemove: () => {
          setMaxPriceInput("")
          setAppliedMaxPrice(undefined)
          setPage(1)
        },
      })
    }

    if (debouncedSearch) {
      list.push({
        id: "search",
        label: `Search: "${debouncedSearch}"`,
        onRemove: () => {
          setSearchInput("")
          setPage(1)
        },
      })
    }

    return list
  }, [selectedCategoryId, flatCategories, appliedMinPrice, appliedMaxPrice, debouncedSearch])

  // Left Filter Panel (Sidebar on desktop / Drawer on mobile)
  const leftFilterPanel = (
    <div className="space-y-6 text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-primary" />
          <h3 className="font-bold text-sm tracking-tight text-foreground">Filters</h3>
        </div>
        {activeFilters.length > 0 && (
          <button
            type="button"
            onClick={handleClearAllFilters}
            className="text-xs text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1"
          >
            <RotateCcw className="size-3" />
            Reset all
          </button>
        )}
      </div>

      {/* Categories Filter Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Tag className="size-3.5" />
            Categories
          </h4>
        </div>

        <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
          {/* All Categories Option */}
          <button
            type="button"
            onClick={() => handleSelectCategory("all")}
            className={cn(
              "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left",
              selectedCategoryId === "all"
                ? "bg-primary/10 font-semibold text-primary"
                : "text-foreground hover:bg-muted"
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "size-3 rounded-full border flex items-center justify-center shrink-0",
                  selectedCategoryId === "all"
                    ? "border-primary bg-primary"
                    : "border-muted-foreground"
                )}
              >
                {selectedCategoryId === "all" && (
                  <span className="size-1 rounded-full bg-white" />
                )}
              </span>
              <span>All Categories</span>
            </div>
          </button>

          {isCategoriesLoading ? (
            <div className="space-y-1.5 pt-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full rounded-md" />
              ))}
            </div>
          ) : (
            flatCategories.map((cat) => {
              const isSelected = selectedCategoryId === String(cat.id)
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectCategory(String(cat.id))}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left",
                    isSelected
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-foreground hover:bg-muted"
                  )}
                  style={{ paddingLeft: `${Math.max(10, cat.level * 16 + 10)}px` }}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className={cn(
                        "size-3 rounded-full border flex items-center justify-center shrink-0",
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      )}
                    >
                      {isSelected && <span className="size-1 rounded-full bg-white" />}
                    </span>
                    <span className="truncate">{cat.name}</span>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Price Range Filter Section */}
      <div className="space-y-3 pt-3 border-t border-border">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <DollarSign className="size-3.5" />
          Price Range
        </h4>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-1.5">
          {PRICE_PRESETS.map((preset, idx) => {
            const isPresetActive =
              appliedMinPrice === preset.min && appliedMaxPrice === preset.max
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPricePreset(preset.min, preset.max)}
                className={cn(
                  "px-2 py-1 text-[11px] rounded-md border transition-colors",
                  isPresetActive
                    ? "bg-primary text-primary-foreground border-primary font-semibold"
                    : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {preset.label}
              </button>
            )
          })}
        </div>

        {/* Custom Min / Max Price Inputs */}
        <form onSubmit={handleApplyPrice} className="space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                htmlFor="min-price-input"
                className="text-[11px] text-muted-foreground block mb-1 font-medium"
              >
                Min ($)
              </label>
              <Input
                id="min-price-input"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={minPriceInput}
                onChange={(e) => setMinPriceInput(e.target.value)}
                inputSize="sm"
              />
            </div>
            <div>
              <label
                htmlFor="max-price-input"
                className="text-[11px] text-muted-foreground block mb-1 font-medium"
              >
                Max ($)
              </label>
              <Input
                id="max-price-input"
                type="number"
                min="0"
                step="1"
                placeholder="5000"
                value={maxPriceInput}
                onChange={(e) => setMaxPriceInput(e.target.value)}
                inputSize="sm"
              />
            </div>
          </div>

          {priceError && (
            <p className="text-[11px] text-destructive leading-tight">{priceError}</p>
          )}

          <Button
            type="submit"
            variant="outline"
            size="sm"
            fullWidth
            className="text-xs font-medium"
          >
            Apply Price
          </Button>
        </form>
      </div>
    </div>
  )

  return (
    <MarketplaceShell
      currentRole="CUSTOMER"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Services" },
      ]}
      heading="Services Marketplace"
      subheading="Explore verified professional services with transparent pricing"
      searchQuery={searchInput}
      onSearchChange={setSearchInput}
      searchPlaceholder="Search services by title or description..."
      sortOption={sortOption}
      onSortChange={(val) => {
        setSortOption(val)
        setPage(1)
      }}
      sortOptions={SERVICE_SORT_OPTIONS}
      activeFilters={activeFilters}
      onClearAllFilters={handleClearAllFilters}
      leftPanel={leftFilterPanel}
    >
      <div className="space-y-6">
        {/* Results summary bar */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div>
            {isServicesLoading ? (
              <span>Loading services catalog...</span>
            ) : (
              <span>
                Found{" "}
                <strong className="font-semibold text-foreground">{meta.total}</strong>{" "}
                {meta.total === 1 ? "service" : "services"}
                {selectedCategoryId !== "all" && (
                  <> in selected category</>
                )}
                {debouncedSearch && (
                  <> matching &ldquo;{debouncedSearch}&rdquo;</>
                )}
              </span>
            )}
          </div>

          {isServicesFetching && !isServicesLoading && (
            <span className="text-[11px] text-primary animate-pulse">
              Updating results...
            </span>
          )}
        </div>

        {/* State 1: Initial Loading Skeleton Grid */}
        {isServicesLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* State 2: Error State */}
        {!isServicesLoading && isServicesError && (
          <ErrorState
            title="Unable to load services"
            message={
              (servicesError as { data?: { message?: string } })?.data?.message ||
              "There was an error communicating with the service catalog. Please verify your connection and try again."
            }
            onRetry={() => refetch()}
            retryLabel="Retry Catalog"
          />
        )}

        {/* State 3: Empty State (No search or filter match) */}
        {!isServicesLoading && !isServicesError && services.length === 0 && activeFilters.length > 0 && (
          <EmptyState
            icon={<Search className="size-7" />}
            title="No matching services found"
            description="We couldn't find any active services matching your search or filters. Try adjusting your search keywords, clearing price thresholds, or resetting filters."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAllFilters}
                leftIcon={<RotateCcw className="size-3.5" />}
              >
                Reset All Filters
              </Button>
            }
          />
        )}

        {/* State 4: Empty State (Catalog has no active services at all) */}
        {!isServicesLoading && !isServicesError && services.length === 0 && activeFilters.length === 0 && (
          <EmptyState
            icon={<Sparkles className="size-7" />}
            title="No services available"
            description="There are currently no active services published in the marketplace. Please check back soon or browse categories."
          />
        )}

        {/* State 5: Successful Results Grid */}
        {!isServicesLoading && !isServicesError && services.length > 0 && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
              {services.map((service) => {
                // Determine primary or first image URL safely
                const primaryImg =
                  service.images?.find((img) => img.isPrimary) || service.images?.[0]
                const imageUrl =
                  primaryImg?.storageKey &&
                  (primaryImg.storageKey.startsWith("http://") ||
                    primaryImg.storageKey.startsWith("https://") ||
                    primaryImg.storageKey.startsWith("/"))
                    ? primaryImg.storageKey
                    : undefined

                return (
                  <ServiceCard
                    key={service.id}
                    id={service.id}
                    title={service.name}
                    description={service.description}
                    category={service.category?.name || "General"}
                    price={service.price}
                    priceType="FIXED"
                    providerName={service.provider?.displayName}
                    durationMinutes={service.durationMinutes}
                    imageUrl={imageUrl}
                    href={`/services/${service.id}`}
                  />
                )
              })}
            </div>

            {/* Pagination Controls */}
            {meta.totalPages > 1 && (
              <div className="pt-6 border-t border-border mt-8">
                <Pagination
                  currentPage={page}
                  totalPages={meta.totalPages}
                  totalItems={meta.total}
                  pageSize={ITEMS_PER_PAGE}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </MarketplaceShell>
  )
}
