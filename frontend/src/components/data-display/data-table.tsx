import * as React from "react"
import { Skeleton } from "@/components/feedback/skeleton"
import { cn } from "@/lib/utils"

export interface DataTableColumn<T> {
  id: string
  header: React.ReactNode
  accessorKey?: keyof T
  cell?: (row: T, index: number) => React.ReactNode
  align?: "left" | "center" | "right"
  className?: string
  headerClassName?: string
}

export interface DataTableProps<T> {
  data: T[]
  columns: DataTableColumn<T>[]
  isLoading?: boolean
  loadingRows?: number
  emptyMessage?: string
  emptyAction?: React.ReactNode
  keyExtractor?: (row: T, index: number) => string | number
  onRowClick?: (row: T) => void
  className?: string
}

export function DataTable<T>({
  data,
  columns,
  isLoading = false,
  loadingRows = 5,
  emptyMessage = "No records found.",
  emptyAction,
  keyExtractor,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }

  return (
    <div className={cn("w-full overflow-hidden rounded-xl border border-border bg-card shadow-xs", className)}>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          {/* Table Header */}
          <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground tracking-wider font-semibold">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.id}
                  scope="col"
                  className={cn(
                    "px-4 py-3.5 whitespace-nowrap",
                    alignClass[col.align || "left"],
                    col.headerClassName
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: loadingRows }).map((_, rIndex) => (
                <tr key={rIndex} className="animate-pulse">
                  {columns.map((col) => (
                    <td key={col.id} className="px-4 py-4">
                      <Skeleton className="h-4 w-full max-w-[120px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  <p className="text-sm">{emptyMessage}</p>
                  {emptyAction && <div className="mt-3">{emptyAction}</div>}
                </td>
              </tr>
            ) : (
              data.map((row, rIndex) => {
                const rowKey = keyExtractor
                  ? keyExtractor(row, rIndex)
                  : (row as { id?: string | number }).id ?? rIndex

                return (
                  <tr
                    key={rowKey}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      "transition-colors hover:bg-muted/30",
                      onRowClick && "cursor-pointer"
                    )}
                  >
                    {columns.map((col) => {
                      const value = col.accessorKey
                        ? (row[col.accessorKey] as React.ReactNode)
                        : null

                      return (
                        <td
                          key={col.id}
                          className={cn(
                            "px-4 py-3.5 text-foreground align-middle",
                            alignClass[col.align || "left"],
                            col.className
                          )}
                        >
                          {col.cell ? col.cell(row, rIndex) : value}
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
