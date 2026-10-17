"use client"

import * as React from "react"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface DatePickerProps {
  value?: string // YYYY-MM-DD
  defaultValue?: string
  onChange?: (date: string) => void
  min?: string
  max?: string
  placeholder?: string
  disabled?: boolean
  error?: boolean | string
  className?: string
  id?: string
  name?: string
  clearable?: boolean
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      min,
      max,
      placeholder = "Select date...",
      disabled = false,
      error,
      className,
      id,
      name,
      clearable = true,
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement | null>(null)
    const [internalVal, setInternalVal] = React.useState<string>(
      value ?? defaultValue ?? ""
    )

    React.useEffect(() => {
      if (value !== undefined) {
        setInternalVal(value)
      }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVal = e.target.value
      setInternalVal(newVal)
      onChange?.(newVal)
    }

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation()
      setInternalVal("")
      onChange?.("")
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    }

    const openPicker = () => {
      if (!disabled && inputRef.current) {
        if ("showPicker" in HTMLInputElement.prototype) {
          try {
            inputRef.current.showPicker()
          } catch {
            inputRef.current.focus()
          }
        } else {
          inputRef.current.focus()
        }
      }
    }

    return (
      <div
        onClick={openPicker}
        className={cn(
          "relative flex h-10 w-full cursor-pointer items-center justify-between rounded-lg border border-input bg-card px-3.5 py-2 text-sm text-foreground shadow-xs transition-colors outline-none",
          "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
          disabled && "cursor-not-allowed bg-muted/40 text-muted-foreground/60 border-border",
          error && "border-destructive text-destructive-foreground focus-within:border-destructive focus-within:ring-destructive/20",
          className
        )}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
          <span
            className={cn(
              "truncate",
              !internalVal && "text-muted-foreground/70"
            )}
          >
            {internalVal || placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {clearable && internalVal && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-md p-1 text-muted-foreground hover:text-foreground focus:outline-none"
              aria-label="Clear date"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Native date input overlay (hidden visually, accessible to clicks / showPicker) */}
        <input
          type="date"
          ref={(node) => {
            inputRef.current = node
            if (typeof ref === "function") {
              ref(node)
            } else if (ref) {
              ref.current = node
            }
          }}
          id={id}
          name={name}
          min={min}
          max={max}
          value={internalVal}
          onChange={handleChange}
          disabled={disabled}
          tabIndex={-1}
          className="pointer-events-none absolute inset-0 opacity-0"
          aria-invalid={!!error}
        />
      </div>
    )
  }
)

DatePicker.displayName = "DatePicker"
