import * as React from "react"
import Link from "next/link"
import { Sparkles, Heart } from "lucide-react"
import { cn } from "@/lib/utils"

export interface FooterProps {
  className?: string
}

export function Footer({ className }: FooterProps) {
  const currentYear = 2026 // Safe static constant to avoid Next.js 16 dynamic prerender assertions

  return (
    <footer
      className={cn(
        "border-t border-border bg-card text-foreground transition-colors",
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                <Sparkles className="size-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-primary">
                ServiceHub
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Smart Service Marketplace & Booking Platform. Connect with verified
              home and personal service professionals with instant scheduling and secure payments.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold tracking-tight text-foreground">
              Services
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/services?category=cleaning" className="hover:text-primary transition-colors">
                  Home Cleaning
                </Link>
              </li>
              <li>
                <Link href="/services?category=plumbing" className="hover:text-primary transition-colors">
                  Plumbing Repairs
                </Link>
              </li>
              <li>
                <Link href="/services?category=electrical" className="hover:text-primary transition-colors">
                  Electrical Work
                </Link>
              </li>
              <li>
                <Link href="/services?category=painting" className="hover:text-primary transition-colors">
                  Painting & Renovation
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold tracking-tight text-foreground">
              Company
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-primary transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/providers/join" className="hover:text-primary transition-colors">
                  Become a Provider
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust & Legal */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold tracking-tight text-foreground">
              Trust & Legal
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/trust" className="hover:text-primary transition-colors">
                  Safety & Guarantee
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {currentYear} ServiceHub. Smart Service Marketplace.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="size-3.5 text-primary fill-primary" /> for seamless bookings
          </p>
        </div>
      </div>
    </footer>
  )
}
