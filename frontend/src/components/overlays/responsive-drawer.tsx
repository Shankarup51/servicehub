"use client"

import * as React from "react"
import { Dialog as RadixDialog } from "radix-ui"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ResponsiveDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  side?: "left" | "right" | "bottom"
  className?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function ResponsiveDrawer({
  open,
  onOpenChange,
  title,
  description,
  side = "right",
  className,
  children,
  footer,
}: ResponsiveDrawerProps) {
  const sideClasses = {
    right:
      "inset-y-0 right-0 h-full w-full max-w-md border-l border-border data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
    left:
      "inset-y-0 left-0 h-full w-full max-w-md border-r border-border data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
    bottom:
      "inset-x-0 bottom-0 max-h-[85vh] w-full rounded-t-2xl border-t border-border data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
  }[side]

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <RadixDialog.Content
          className={cn(
            "fixed z-50 flex flex-col bg-card p-6 shadow-2xl transition-all duration-300 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out",
            sideClasses,
            className
          )}
        >
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              {title && (
                <RadixDialog.Title className="text-lg font-semibold tracking-tight text-foreground">
                  {title}
                </RadixDialog.Title>
              )}
              {description && (
                <RadixDialog.Description className="mt-1 text-sm text-muted-foreground">
                  {description}
                </RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none">
              <X className="size-5" />
              <span className="sr-only">Close</span>
            </RadixDialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto py-4">{children}</div>

          {footer && (
            <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
              {footer}
            </div>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
