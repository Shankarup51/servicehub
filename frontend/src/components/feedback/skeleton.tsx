import * as React from "react"
import { cn } from "@/lib/utils"

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shape?: "rectangle" | "circle" | "pill"
}

export function Skeleton({
  className,
  shape = "rectangle",
  ...props
}: SkeletonProps) {
  const shapeClass = {
    rectangle: "rounded-lg",
    circle: "rounded-full",
    pill: "rounded-full",
  }[shape]

  return (
    <div
      className={cn(
        "animate-pulse bg-muted/70",
        shapeClass,
        className
      )}
      {...props}
    />
  )
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={cn("space-y-2.5 w-full", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4 w-full",
            i === lines - 1 && lines > 1 ? "w-3/5" : "w-full"
          )}
        />
      ))}
    </div>
  )
}

export function SkeletonAvatar({
  size = "default",
  className,
}: {
  size?: "sm" | "default" | "lg"
  className?: string
}) {
  const sizeClass = {
    sm: "size-8",
    default: "size-10",
    lg: "size-14",
  }[size]

  return <Skeleton shape="circle" className={cn(sizeClass, className)} />
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-xs",
        className
      )}
    >
      <Skeleton className="h-44 w-full rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
    </div>
  )
}
