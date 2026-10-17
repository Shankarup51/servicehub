import * as React from "react"
import Link from "next/link"
import { Star, Clock, Sparkles } from "lucide-react"
import { Card } from "./base-card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface ServiceCardProps {
  id: string
  title: string
  description?: string
  category: string
  price: number
  priceType?: "HOURLY" | "FIXED"
  rating?: number
  reviewCount?: number
  providerName?: string
  durationMinutes?: number
  imageUrl?: string
  href?: string
  onBook?: () => void
  className?: string
}

export function ServiceCard({
  id,
  title,
  description,
  category,
  price,
  priceType = "HOURLY",
  rating = 4.9,
  reviewCount = 28,
  providerName = "Verified Pro",
  durationMinutes = 60,
  imageUrl,
  href = `/services/${id}`,
  onBook,
  className,
}: ServiceCardProps) {
  return (
    <Card
      variant="interactive"
      className={cn("flex flex-col h-full group bg-card", className)}
    >
      {/* Image / Header Media */}
      <div className="relative h-44 w-full bg-muted overflow-hidden">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary/50 text-primary">
            <Sparkles className="size-10 opacity-40 group-hover:scale-110 transition-transform" />
          </div>
        )}

        {/* Category tag */}
        <span className="absolute left-3 top-3 rounded-full bg-card/90 backdrop-blur-xs px-2.5 py-1 text-xs font-semibold text-primary shadow-xs">
          {category}
        </span>
      </div>

      {/* Card Content */}
      <div className="flex flex-col flex-1 p-5 space-y-3">
        {/* Rating & Pro */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{providerName}</span>
          <div className="flex items-center gap-1 text-amber-500 font-semibold">
            <Star className="size-3.5 fill-amber-400 stroke-amber-500" />
            <span>{rating.toFixed(1)}</span>
            <span className="text-muted-foreground font-normal">({reviewCount})</span>
          </div>
        </div>

        {/* Title */}
        <Link href={href} className="focus:outline-none">
          <h4 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {title}
          </h4>
        </Link>

        {/* Description */}
        {description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        {/* Meta: Duration */}
        {durationMinutes && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
            <Clock className="size-3.5" />
            <span>Approx. {durationMinutes} mins</span>
          </div>
        )}

        {/* Price & CTA */}
        <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground block">
              {priceType === "HOURLY" ? "Rate" : "Starting at"}
            </span>
            <span className="text-lg font-bold text-foreground">
              ${price}
              {priceType === "HOURLY" && (
                <span className="text-xs font-normal text-muted-foreground">/hr</span>
              )}
            </span>
          </div>

          {onBook ? (
            <Button size="sm" variant="primary" onClick={onBook}>
              Book Now
            </Button>
          ) : (
            <Button size="sm" variant="primary" asChild>
              <Link href={href}>View Details</Link>
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
