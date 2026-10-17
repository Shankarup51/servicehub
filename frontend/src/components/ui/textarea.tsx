import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.ComponentProps<"textarea"> {
  error?: boolean | string
  showCount?: boolean
  resize?: "none" | "vertical" | "horizontal" | "both"
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      error,
      showCount = false,
      maxLength,
      value,
      defaultValue,
      onChange,
      resize = "vertical",
      disabled,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const [charLength, setCharLength] = React.useState<number>(() => {
      if (typeof value === "string") return value.length
      if (typeof defaultValue === "string") return defaultValue.length
      return 0
    })

    React.useEffect(() => {
      if (typeof value === "string") {
        setCharLength(value.length)
      }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharLength(e.target.value.length)
      onChange?.(e)
    }

    const resizeClass = {
      none: "resize-none",
      vertical: "resize-y",
      horizontal: "resize-x",
      both: "resize",
    }[resize]

    return (
      <div className="relative w-full">
        <textarea
          ref={ref}
          rows={rows}
          value={value}
          defaultValue={defaultValue}
          maxLength={maxLength}
          onChange={handleChange}
          disabled={disabled}
          aria-invalid={!!error}
          className={cn(
            "flex w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm text-foreground transition-all duration-200 outline-none placeholder:text-muted-foreground/70",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
            "disabled:cursor-not-allowed disabled:bg-muted/40 disabled:text-muted-foreground/60 disabled:border-border",
            error && "border-destructive text-destructive-foreground focus:border-destructive focus:ring-destructive/20",
            resizeClass,
            className
          )}
          {...props}
        />
        {showCount && maxLength !== undefined && (
          <div className="mt-1 flex justify-end text-xs text-muted-foreground">
            <span>
              {charLength} / {maxLength}
            </span>
          </div>
        )}
      </div>
    )
  }
)

Textarea.displayName = "Textarea"

export { Textarea }
