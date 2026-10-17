import * as React from "react"
import { cn } from "@/lib/utils"

export interface FormActionsProps {
  align?: "left" | "center" | "right" | "between"
  sticky?: boolean
  className?: string
  children: React.ReactNode
}

export function FormActions({
  align = "right",
  sticky = false,
  className,
  children,
}: FormActionsProps) {
  const alignmentClass = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
    between: "justify-between",
  }[align]

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 pt-4 w-full",
        alignmentClass,
        sticky &&
          "sticky bottom-0 z-20 bg-background/95 backdrop-blur-xs py-3 border-t border-border -mx-4 px-4 sm:-mx-6 sm:px-6",
        className
      )}
    >
      {children}
    </div>
  )
}
