import * as React from "react"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Card } from "./base-card"
import { cn } from "@/lib/utils"

export interface StatisticCardProps {
  title: string
  value: string | number
  change?: {
    value: number | string
    isPositive: boolean
    label?: string
  }
  icon?: React.ReactNode
  description?: string
  className?: string
}

export function StatisticCard({
  title,
  value,
  change,
  icon,
  description,
  className,
}: StatisticCardProps) {
  return (
    <Card className={cn("p-5 sm:p-6", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {icon && (
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary [&_svg]:size-5">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          {value}
        </span>
      </div>

      {(change || description) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {change && (
            <span
              className={cn(
                "inline-flex items-center font-semibold px-1.5 py-0.5 rounded",
                change.isPositive
                  ? "bg-success text-success-foreground"
                  : "bg-destructive text-destructive-foreground"
              )}
            >
              {change.isPositive ? (
                <ArrowUpRight className="size-3 mr-0.5" />
              ) : (
                <ArrowDownRight className="size-3 mr-0.5" />
              )}
              {change.value}
            </span>
          )}
          {change?.label && (
            <span className="text-muted-foreground">{change.label}</span>
          )}
          {!change && description && (
            <span className="text-muted-foreground">{description}</span>
          )}
        </div>
      )}
    </Card>
  )
}
