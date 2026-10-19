"use client"

import * as React from "react"
import { Eye, EyeOff, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface InputProps extends Omit<React.ComponentProps<"input">, "size"> {
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  error?: boolean | string
  inputSize?: "sm" | "default" | "lg"
  clearable?: boolean
  onClear?: () => void
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      leftIcon,
      rightIcon,
      error,
      inputSize = "default",
      clearable = false,
      onClear,
      disabled,
      value,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const isPasswordType = type === "password"
    const effectiveType = isPasswordType ? (showPassword ? "text" : "password") : type

    const sizeClasses = {
      sm: "h-8 text-xs px-2.5",
      default: "h-10 text-sm px-3.5",
      lg: "h-12 text-base px-4",
    }

    const hasValue = value !== undefined && value !== ""

    const hasDoubleRightAction = clearable && hasValue && isPasswordType
    const hasRightAction = rightIcon || isPasswordType || (clearable && hasValue)

    // Padding classes tailored to inputSize when left or right icons are present
    const leftPaddingClass = leftIcon
      ? {
          sm: "pl-8.5",
          default: "pl-10",
          lg: "pl-11",
        }[inputSize]
      : ""

    const rightPaddingClass = hasDoubleRightAction
      ? "pr-16"
      : hasRightAction
      ? {
          sm: "pr-8.5",
          default: "pr-10",
          lg: "pr-11",
        }[inputSize]
      : ""

    const leftIconPosClass = {
      sm: "left-2.5",
      default: "left-3.5",
      lg: "left-4",
    }[inputSize]

    return (
      <div className="relative flex w-full items-center">
        {leftIcon && (
          <div
            className={cn(
              "pointer-events-none absolute flex items-center justify-center text-muted-foreground [&_svg]:size-4 shrink-0 select-none z-10",
              leftIconPosClass
            )}
          >
            {leftIcon}
          </div>
        )}

        <input
          type={effectiveType}
          ref={ref}
          disabled={disabled}
          value={value}
          aria-invalid={!!error}
          className={cn(
            "flex w-full rounded-lg border border-input bg-card text-foreground transition-all duration-200 outline-none placeholder:text-muted-foreground/70",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
            "disabled:cursor-not-allowed disabled:bg-muted/40 disabled:text-muted-foreground/60 disabled:border-border",
            error && "border-destructive focus:border-destructive focus:ring-destructive/20",
            // IMPORTANT: sizeClasses must come BEFORE leftPaddingClass and rightPaddingClass
            // so twMerge does not allow px-* to override pl-* and pr-*
            sizeClasses[inputSize],
            leftPaddingClass,
            rightPaddingClass,
            className
          )}
          {...props}
        />

        <div className="absolute right-2.5 flex items-center gap-1.5 z-10">
          {clearable && hasValue && !disabled && (
            <button
              type="button"
              onClick={onClear}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30"
              tabIndex={-1}
              aria-label="Clear input"
            >
              <X className="size-3.5" />
            </button>
          )}

          {isPasswordType && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={disabled}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          )}

          {!isPasswordType && rightIcon && (
            <div className="pointer-events-none flex items-center text-muted-foreground [&_svg]:size-4 shrink-0">
              {rightIcon}
            </div>
          )}
        </div>
      </div>
    )
  }
)

Input.displayName = "Input"

export { Input }
