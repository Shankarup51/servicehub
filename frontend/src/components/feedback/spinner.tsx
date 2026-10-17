import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "xs" | "sm" | "default" | "lg" | "xl"
  color?: "primary" | "foreground" | "white" | "muted"
  centered?: boolean
  label?: string
}

export function Spinner({
  size = "default",
  color = "primary",
  centered = false,
  label,
  className,
  ...props
}: SpinnerProps) {
  const sizeMap = {
    xs: "size-3.5",
    sm: "size-4",
    default: "size-6",
    lg: "size-8",
    xl: "size-12",
  }

  const colorMap = {
    primary: "text-primary",
    foreground: "text-foreground",
    white: "text-white",
    muted: "text-muted-foreground",
  }

  const spinnerIcon = (
    <Loader2
      className={cn("animate-spin shrink-0", sizeMap[size], colorMap[color])}
      aria-hidden="true"
    />
  )

  if (centered) {
    return (
      <div
        role="status"
        className={cn(
          "flex flex-col items-center justify-center gap-3 p-6 w-full h-full min-h-[140px]",
          className
        )}
        {...props}
      >
        {spinnerIcon}
        {label && (
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            {label}
          </p>
        )}
        <span className="sr-only">{label || "Loading..."}</span>
      </div>
    )
  }

  return (
    <div
      role="status"
      className={cn("inline-flex items-center gap-2", className)}
      {...props}
    >
      {spinnerIcon}
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
      <span className="sr-only">{label || "Loading..."}</span>
    </div>
  )
}
