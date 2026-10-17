"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Sparkles } from "lucide-react"
import { useAppSelector } from "@/lib/hooks"
import { Button } from "@/components/ui/button"
import { ResponsiveDrawer } from "@/components/overlays/responsive-drawer"
import { cn } from "@/lib/utils"

export interface HeaderProps {
  user?: {
    name?: string
    email?: string
  }
  className?: string
}

const navLinks = [
  { label: "Find Services", href: "/services" },
  { label: "Categories", href: "/categories" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Providers", href: "/providers" },
]

export function Header({ user: propUser, className }: HeaderProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const reduxUser = useAppSelector((state) => state.auth.user)

  const user =
    propUser ||
    (reduxUser
      ? {
          name: `${reduxUser.firstName} ${reduxUser.lastName || ""}`.trim(),
          email: reduxUser.email,
        }
      : undefined)

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b border-border bg-card/85 backdrop-blur-md transition-all",
        className
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs group-hover:bg-primary/90 transition-colors">
            <Sparkles className="size-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-primary">
              ServiceHub
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  isActive ? "text-primary font-semibold" : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Desktop CTA & User */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-foreground">
                {user.name || user.email}
              </span>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </div>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button variant="primary" size="sm" asChild>
                <Link href="/services">Book a Service</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          aria-label="Open navigation menu"
        >
          <Menu className="size-6" />
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      <ResponsiveDrawer
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        title="Navigation"
        side="right"
      >
        <div className="flex flex-col gap-4 py-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "px-3 py-2 text-base font-medium rounded-lg transition-colors",
                pathname === link.href
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-foreground hover:bg-muted"
              )}
            >
              {link.label}
            </Link>
          ))}

          <div className="mt-6 flex flex-col gap-2.5 pt-6 border-t border-border">
            {user ? (
              <Button variant="primary" asChild onClick={() => setMobileOpen(false)}>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="outline" asChild onClick={() => setMobileOpen(false)}>
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button variant="primary" asChild onClick={() => setMobileOpen(false)}>
                  <Link href="/services">Book a Service</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </ResponsiveDrawer>
    </header>
  )
}
