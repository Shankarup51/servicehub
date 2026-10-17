import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors",
  {
    variants: {
      status: {
        success: "bg-success text-success-foreground border border-success-foreground/20",
        warning: "bg-warning text-warning-foreground border border-warning-foreground/20",
        processing: "bg-processing text-processing-foreground border border-processing-foreground/20",
        destructive: "bg-destructive text-destructive-foreground border border-destructive-foreground/20",
        primary: "bg-primary/10 text-primary border border-primary/20",
        neutral: "bg-muted text-muted-foreground border border-border",
      },
      size: {
        sm: "px-2 py-0.5 text-[11px]",
        default: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      status: "neutral",
      size: "default",
    },
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  hasDot?: boolean
}

export function StatusBadge({
  status = "neutral",
  size = "default",
  hasDot = false,
  className,
  children,
  ...props
}: StatusBadgeProps) {
  const dotColorClass = {
    success: "bg-success-foreground",
    warning: "bg-warning-foreground",
    processing: "bg-processing-foreground",
    destructive: "bg-destructive-foreground",
    primary: "bg-primary",
    neutral: "bg-muted-foreground",
  }[status || "neutral"]

  return (
    <span
      className={cn(badgeVariants({ status, size }), className)}
      {...props}
    >
      {hasDot && (
        <span
          className={cn("size-1.5 rounded-full shrink-0", dotColorClass)}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
}
