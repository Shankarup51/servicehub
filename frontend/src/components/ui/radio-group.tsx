"use client"

import * as React from "react"
import { RadioGroup as RadixRadioGroup } from "radix-ui"
import { cn } from "@/lib/utils"

export const RadioGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof RadixRadioGroup.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadixRadioGroup.Root
      ref={ref}
      className={cn("grid gap-3", className)}
      {...props}
    />
  )
})
RadioGroup.displayName = RadixRadioGroup.Root.displayName

export interface RadioGroupItemProps
  extends React.ComponentPropsWithoutRef<typeof RadixRadioGroup.Item> {
  label?: React.ReactNode
  description?: React.ReactNode
}

export const RadioGroupItem = React.forwardRef<
  HTMLButtonElement,
  RadioGroupItemProps
>(({ className, label, description, id, disabled, ...props }, ref) => {
  const generatedId = React.useId()
  const radioId = id || generatedId

  return (
    <div className="flex items-start gap-2.5">
      <RadixRadioGroup.Item
        ref={ref}
        id={radioId}
        disabled={disabled}
        className={cn(
          "peer size-4.5 shrink-0 rounded-full border border-input bg-card shadow-xs transition-colors outline-none",
          "focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary",
          "disabled:cursor-not-allowed disabled:bg-muted/40 disabled:border-border disabled:opacity-50",
          "data-[state=checked]:border-primary",
          className
        )}
        {...props}
      >
        <RadixRadioGroup.Indicator className="flex items-center justify-center">
          <div className="size-2.5 rounded-full bg-primary" />
        </RadixRadioGroup.Indicator>
      </RadixRadioGroup.Item>

      {(label || description) && (
        <div className="flex flex-col select-none leading-none pt-0.5">
          {label && (
            <label
              htmlFor={radioId}
              className={cn(
                "text-sm font-medium text-foreground cursor-pointer leading-tight",
                disabled && "cursor-not-allowed opacity-60"
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <p className="mt-1 text-xs text-muted-foreground leading-normal">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  )
})
RadioGroupItem.displayName = RadixRadioGroup.Item.displayName
