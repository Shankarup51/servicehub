import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const textVariants = cva("transition-colors", {
  variants: {
    variant: {
      h1: "text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground",
      h2: "text-2xl sm:text-3xl font-bold tracking-tight text-foreground",
      h3: "text-xl sm:text-2xl font-semibold tracking-tight text-foreground",
      h4: "text-lg sm:text-xl font-semibold text-foreground",
      h5: "text-base sm:text-lg font-semibold text-foreground",
      h6: "text-sm sm:text-base font-semibold text-foreground",
      lead: "text-lg sm:text-xl text-muted-foreground font-normal leading-relaxed",
      body: "text-base leading-relaxed text-foreground",
      "body-sm": "text-sm leading-normal text-foreground",
      caption: "text-xs text-muted-foreground leading-normal",
      muted: "text-sm text-muted-foreground",
      label: "text-sm font-medium text-foreground select-none",
      link: "text-primary hover:text-primary/80 underline-offset-4 hover:underline cursor-pointer transition-colors",
    },
    color: {
      default: "text-foreground",
      primary: "text-primary",
      secondary: "text-secondary-foreground",
      muted: "text-muted-foreground",
      destructive: "text-destructive-foreground",
      success: "text-success-foreground",
      warning: "text-warning-foreground",
      white: "text-white",
    },
    align: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
      justify: "text-justify",
    },
    weight: {
      light: "font-light",
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
  },
  defaultVariants: {
    variant: "body",
  },
})

type ElementType = keyof React.JSX.IntrinsicElements

const defaultElementMap: Record<NonNullable<VariantProps<typeof textVariants>["variant"]>, ElementType> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  lead: "p",
  body: "p",
  "body-sm": "p",
  caption: "span",
  muted: "span",
  label: "label",
  link: "span",
}

export interface WebTextProps<T extends ElementType = "p">
  extends VariantProps<typeof textVariants> {
  as?: T
  children?: React.ReactNode
  className?: string
}

export function WebText<T extends ElementType = "p">({
  as,
  variant = "body",
  color,
  align,
  weight,
  className,
  children,
  ...props
}: WebTextProps<T> & Omit<React.ComponentPropsWithoutRef<T>, keyof WebTextProps<T>>) {
  const Component = (as || defaultElementMap[variant || "body"] || "p") as React.ElementType

  return (
    <Component
      className={cn(textVariants({ variant, color, align, weight }), className)}
      {...props}
    >
      {children}
    </Component>
  )
}
