import * as React from "react"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface FormFieldProps {
  label?: string
  htmlFor?: string
  required?: boolean
  hint?: string
  error?: string | boolean
  className?: string
  labelClassName?: string
  children: React.ReactNode
}

export function FormField({
  label,
  htmlFor,
  required = false,
  hint,
  error,
  className,
  labelClassName,
  children,
}: FormFieldProps) {
  const hasErrorMessage = typeof error === "string" && error.length > 0

  return (
    <div className={cn("flex flex-col gap-1.5 w-full", className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className={cn(
            "text-sm font-medium text-foreground flex items-center gap-1 select-none",
            labelClassName
          )}
        >
          <span>{label}</span>
          {required && (
            <span className="text-destructive font-bold" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      {children}

      {hint && !hasErrorMessage && (
        <p className="text-xs text-muted-foreground leading-normal">{hint}</p>
      )}

      {hasErrorMessage && (
        <div
          role="alert"
          className="flex items-center gap-1.5 text-xs text-destructive mt-0.5 animate-in fade-in-50 duration-150"
        >
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
