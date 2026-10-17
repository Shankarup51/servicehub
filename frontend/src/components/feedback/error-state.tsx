import * as React from "react"
import { AlertTriangle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface ErrorStateProps {
  title?: string
  message?: string
  details?: string
  onRetry?: () => void
  retryLabel?: string
  className?: string
}

export function ErrorState({
  title = "Something went wrong",
  message = "An error occurred while loading this data. Please try again.",
  details,
  onRetry,
  retryLabel = "Try Again",
  className,
}: ErrorStateProps) {
  const [showDetails, setShowDetails] = React.useState(false)

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 sm:p-10 rounded-2xl border border-destructive/30 bg-destructive/5 max-w-md mx-auto my-6",
        className
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/15 text-destructive-foreground mb-4">
        <AlertTriangle className="size-7" />
      </div>

      <h3 className="text-lg font-semibold text-foreground tracking-tight">
        {title}
      </h3>

      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed max-w-sm">
        {message}
      </p>

      {details && (
        <div className="mt-3 w-full">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            {showDetails ? "Hide technical details" : "Show technical details"}
          </button>
          {showDetails && (
            <pre className="mt-2 text-left text-xs bg-card p-3 rounded border border-border overflow-x-auto text-destructive-foreground max-h-36">
              {details}
            </pre>
          )}
        </div>
      )}

      {onRetry && (
        <div className="mt-5">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            leftIcon={<RotateCcw className="size-3.5" />}
          >
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  )
}
