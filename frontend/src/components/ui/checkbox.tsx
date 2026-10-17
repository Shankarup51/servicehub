"use client"

import * as React from "react"
import { Checkbox as RadixCheckbox } from "radix-ui"
import { Check, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof RadixCheckbox.Root> {
  label?: React.ReactNode
  description?: React.ReactNode
  error?: boolean | string
}

export const Checkbox = React.forwardRef<
  HTMLButtonElement,
  CheckboxProps
>(({ className, label, description, error, id, disabled, checked, ...props }, ref) => {
  const generatedId = React.useId()
  const checkboxId = id || generatedId

  return (
    <div className="flex items-start gap-2.5">
      <RadixCheckbox.Root
        ref={ref}
        id={checkboxId}
        disabled={disabled}
        checked={checked}
        aria-invalid={!!error}
        className={cn(
          "peer relative size-4.5 shrink-0 rounded border border-input bg-card shadow-xs transition-all duration-150 outline-none",
          "focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary",
          "disabled:cursor-not-allowed disabled:bg-muted/40 disabled:border-border disabled:opacity-50",
          "data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground",
          "data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:text-primary-foreground",
          error && "border-destructive focus-visible:ring-destructive/20",
          className
        )}
        {...props}
      >
        <RadixCheckbox.Indicator className="flex items-center justify-center text-current">
          {checked === "indeterminate" ? (
            <Minus className="size-3.5 stroke-[3]" />
          ) : (
            <Check className="size-3.5 stroke-[3]" />
          )}
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>

      {(label || description) && (
        <div className="flex flex-col select-none leading-none pt-0.5">
          {label && (
            <label
              htmlFor={checkboxId}
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

Checkbox.displayName = "Checkbox"
