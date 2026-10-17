import * as React from "react"
import Link from "next/link"
import { ArrowRight, Layers } from "lucide-react"
import { Card } from "./base-card"
import { cn } from "@/lib/utils"

export interface CategoryCardProps {
  id: string
  name: string
  description?: string
  serviceCount?: number
  icon?: React.ReactNode
  href?: string
  className?: string
}

export function CategoryCard({
  id,
  name,
  description,
  serviceCount,
  icon,
  href = `/categories/${id}`,
  className,
}: CategoryCardProps) {
  return (
    <Link href={href} className="group block focus:outline-none">
      <Card
        variant="interactive"
        className={cn(
          "flex flex-col p-5 sm:p-6 h-full transition-all duration-200 group-hover:border-primary/50 group-hover:shadow-md",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary transition-transform duration-200 group-hover:scale-110 [&_svg]:size-6">
            {icon || <Layers />}
          </div>
          {serviceCount !== undefined && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              {serviceCount} services
            </span>
          )}
        </div>

        <div className="mt-4 space-y-1">
          <h4 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
            {name}
          </h4>
          {description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-medium text-primary">
          <span>Explore services</span>
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
        </div>
      </Card>
    </Link>
  )
}
