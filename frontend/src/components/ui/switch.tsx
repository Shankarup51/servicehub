"use client"

import * as React from "react"
import { Switch as RadixSwitch } from "radix-ui"
import { cn } from "@/lib/utils"

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof RadixSwitch.Root> {
  label?: React.ReactNode
  description?: React.ReactNode
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, label, description, id, disabled, ...props }, ref) => {
    const generatedId = React.useId()
    const switchId = id || generatedId

    return (
      <div className="flex items-start gap-3">
        <RadixSwitch.Root
          ref={ref}
          id={switchId}
          disabled={disabled}
          className={cn(
            "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 outline-none",
            "bg-muted/80 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "data-[state=checked]:bg-primary",
            className
          )}
          {...props}
        >
          <RadixSwitch.Thumb
            className={cn(
              "pointer-events-none block size-5 rounded-full bg-card shadow-md transition-transform duration-200",
              "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
            )}
          />
        </RadixSwitch.Root>

        {(label || description) && (
          <div className="flex flex-col select-none leading-none pt-0.5">
            {label && (
              <label
                htmlFor={switchId}
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
  }
)

Switch.displayName = "Switch"
