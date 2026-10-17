"use client"

import * as React from "react"
import { Search, SlidersHorizontal, RotateCcw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface FilterOption {
  label: string
  value: string
}

export interface SearchFilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  placeholder?: string
  categories?: FilterOption[]
  selectedCategory?: string
  onCategoryChange?: (category: string) => void
  sortOptions?: FilterOption[]
  selectedSort?: string
  onSortChange?: (sort: string) => void
  onResetFilters?: () => void
  hasActiveFilters?: boolean
  className?: string
  children?: React.ReactNode
}

export function SearchFilterBar({
  searchQuery,
  onSearchChange,
  placeholder = "Search services, categories, or keywords...",
  categories,
  selectedCategory,
  onCategoryChange,
  sortOptions,
  selectedSort,
  onSortChange,
  onResetFilters,
  hasActiveFilters,
  className,
  children,
}: SearchFilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs",
        className
      )}
    >
      <div className="flex flex-col md:flex-row items-center gap-3">
        {/* Search input */}
        <div className="w-full flex-1">
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            leftIcon={<Search className="size-4" />}
            clearable
            onClear={() => onSearchChange("")}
          />
        </div>

        {/* Category select */}
        {categories && onCategoryChange && (
          <div className="w-full md:w-56 shrink-0">
            <Select
              value={selectedCategory}
              onValueChange={onCategoryChange}
              placeholder="All Categories"
              options={[
                { label: "All Categories", value: "" },
                ...categories,
              ]}
            />
          </div>
        )}

        {/* Sort select */}
        {sortOptions && onSortChange && (
          <div className="w-full md:w-48 shrink-0">
            <Select
              value={selectedSort}
              onValueChange={onSortChange}
              placeholder="Sort by"
              options={sortOptions}
            />
          </div>
        )}

        {/* Reset filters button */}
        {hasActiveFilters && onResetFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="text-muted-foreground hover:text-foreground shrink-0"
            leftIcon={<RotateCcw className="size-3.5" />}
          >
            Reset
          </Button>
        )}
      </div>

      {/* Optional custom filter chips or child widgets */}
      {children && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
            <SlidersHorizontal className="size-3.5" />
            <span>Filters:</span>
          </div>
          {children}
        </div>
      )}
    </div>
  )
}
