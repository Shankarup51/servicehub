import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems?: number
  pageSize?: number
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | "...")[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      if (currentPage > 3) {
        pages.push("...")
      }

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push("...")
      }

      pages.push(totalPages)
    }

    return pages
  }

  const pages = getPageNumbers()

  return (
    <nav
      aria-label="Pagination Navigation"
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-4 py-3 text-sm text-muted-foreground",
        className
      )}
    >
      {/* Item summary info */}
      {totalItems !== undefined && pageSize !== undefined ? (
        <div className="text-xs text-muted-foreground">
          Showing{" "}
          <strong className="font-semibold text-foreground">
            {Math.min((currentPage - 1) * pageSize + 1, totalItems)}
          </strong>{" "}
          to{" "}
          <strong className="font-semibold text-foreground">
            {Math.min(currentPage * pageSize, totalItems)}
          </strong>{" "}
          of <strong className="font-semibold text-foreground">{totalItems}</strong> entries
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">
          Page <strong className="font-semibold text-foreground">{currentPage}</strong> of{" "}
          <strong className="font-semibold text-foreground">{totalPages}</strong>
        </div>
      )}

      {/* Page controls */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>

        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-xs text-muted-foreground select-none"
                >
                  ...
                </span>
              )
            }

            const isCurrent = p === currentPage

            return (
              <Button
                key={p}
                variant={isCurrent ? "primary" : "outline"}
                size="icon-sm"
                onClick={() => onPageChange(p as number)}
                aria-current={isCurrent ? "page" : undefined}
                className={cn(
                  "text-xs font-medium",
                  isCurrent && "font-bold shadow-xs"
                )}
              >
                {p}
              </Button>
            )
          })}
        </div>

        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Go to next page"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </nav>
  )
}
