import * as React from "react"
import { cn } from "@/lib/utils"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined" | "interactive"
}

export function Card({
  className,
  variant = "default",
  ...props
}: CardProps) {
  const variantClasses = {
    default: "bg-card text-foreground border border-border shadow-xs",
    elevated: "bg-card text-foreground border border-border shadow-md hover:shadow-lg",
    outlined: "bg-card text-foreground border border-border",
    interactive:
      "bg-card text-foreground border border-border shadow-xs hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
  }[variant]

  return (
    <div
      className={cn(
        "rounded-2xl transition-all duration-200 overflow-hidden",
        variantClasses,
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-5 sm:p-6", className)}
      {...props}
    />
  )
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-lg font-semibold leading-none tracking-tight text-foreground", className)}
      {...props}
    />
  )
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-muted-foreground leading-relaxed", className)}
      {...props}
    />
  )
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 sm:p-6 pt-0 sm:pt-0", className)} {...props} />
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center p-5 sm:p-6 pt-0 sm:pt-0 border-t border-border/60 mt-4", className)}
      {...props}
    />
  )
}
