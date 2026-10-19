import * as React from "react"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Card } from "./base-card"
import { cn } from "@/lib/utils"

export type StatisticGradient = "amber" | "emerald" | "blue" | "purple" | "primary" | "rose" | "teal"

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
  gradient?: StatisticGradient
}

const gradientStyles: Record<
  StatisticGradient,
  {
    card: string
    topBar: string
    iconBg: string
  }
> = {
  amber: {
    card: "bg-gradient-to-br from-amber-500/10 via-card to-amber-500/5 border-amber-500/25 hover:border-amber-500/40 hover:shadow-amber-500/10",
    topBar: "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600",
    iconBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30",
  },
  emerald: {
    card: "bg-gradient-to-br from-emerald-500/10 via-card to-emerald-500/5 border-emerald-500/25 hover:border-emerald-500/40 hover:shadow-emerald-500/10",
    topBar: "bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600",
    iconBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
  },
  blue: {
    card: "bg-gradient-to-br from-blue-500/10 via-card to-blue-500/5 border-blue-500/25 hover:border-blue-500/40 hover:shadow-blue-500/10",
    topBar: "bg-gradient-to-r from-blue-400 via-sky-500 to-indigo-500",
    iconBg: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30",
  },
  purple: {
    card: "bg-gradient-to-br from-purple-500/10 via-card to-purple-500/5 border-purple-500/25 hover:border-purple-500/40 hover:shadow-purple-500/10",
    topBar: "bg-gradient-to-r from-purple-400 via-violet-500 to-fuchsia-500",
    iconBg: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30",
  },
  primary: {
    card: "bg-gradient-to-br from-primary/15 via-card to-primary/5 border-primary/25 hover:border-primary/40 hover:shadow-primary/10",
    topBar: "bg-gradient-to-r from-primary via-amber-500 to-primary",
    iconBg: "bg-primary/15 text-primary border border-primary/30",
  },
  rose: {
    card: "bg-gradient-to-br from-rose-500/10 via-card to-rose-500/5 border-rose-500/25 hover:border-rose-500/40 hover:shadow-rose-500/10",
    topBar: "bg-gradient-to-r from-rose-400 via-pink-500 to-red-500",
    iconBg: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30",
  },
  teal: {
    card: "bg-gradient-to-br from-teal-500/10 via-card to-teal-500/5 border-teal-500/25 hover:border-teal-500/40 hover:shadow-teal-500/10",
    topBar: "bg-gradient-to-r from-teal-400 via-cyan-500 to-emerald-500",
    iconBg: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30",
  },
}

export function StatisticCard({
  title,
  value,
  change,
  icon,
  description,
  className,
  gradient,
}: StatisticCardProps) {
  const g = gradient ? gradientStyles[gradient] : null

  return (
    <Card
      className={cn(
        "p-5 sm:p-6 relative overflow-hidden transition-all duration-200 shadow-xs hover:shadow-md",
        g ? g.card : "bg-card border-border",
        className
      )}
    >
      {/* Top Gradient Accent Stripe */}
      {g && <div className={cn("absolute top-0 left-0 right-0 h-1", g.topBar)} />}

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-muted-foreground">{title}</p>
        {icon && (
          <div
            className={cn(
              "flex size-10 items-center justify-center rounded-xl [&_svg]:size-5 shadow-2xs",
              g ? g.iconBg : "bg-primary/10 text-primary"
            )}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
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
