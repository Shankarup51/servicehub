"use client"

import * as React from "react"
import { Sparkles, ShieldCheck, Clock, Award, Star } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageContainer } from "@/components/layout/page-container"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20 selection:text-primary">
      {/* Authoritative Global Header */}
      <Header />

      {/* Main Split Layout */}
      <main className="flex-1 flex items-center justify-center py-8 sm:py-12">
        <PageContainer maxWidth="xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left / Side Showcase Banner (Visible on large screens) */}
            <div className="hidden lg:flex lg:col-span-5 flex-col justify-between space-y-8 p-8 rounded-3xl bg-linear-to-br from-secondary/70 via-card to-secondary/30 border border-border shadow-md relative overflow-hidden">
              {/* Subtle decorative glow */}
              <div className="absolute -top-16 -right-16 size-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 size-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

              <div className="space-y-4 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide border border-primary/20">
                  <Sparkles className="size-3.5" />
                  <span>Smart Service Marketplace</span>
                </div>

                <h2 className="text-3xl font-bold tracking-tight text-foreground leading-tight">
                  Quality home & personal services, scheduled in seconds.
                </h2>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  Join over 45,000 satisfied homeowners and trusted service professionals
                  with upfront pricing, verified background checks, and instant booking.
                </p>
              </div>

              {/* Feature Bullets */}
              <div className="space-y-3.5 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-card text-primary shadow-xs border border-border">
                    <ShieldCheck className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">
                      100% Verified Professionals
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Rigorous ID verification and background checks
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-card text-primary shadow-xs border border-border">
                    <Clock className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">
                      Instant 60-Second Scheduling
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Real-time calendar availability without phone tag
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-card text-primary shadow-xs border border-border">
                    <Award className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">
                      Zero-Deductible Guarantee
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Full satisfaction coverage on every completed booking
                    </p>
                  </div>
                </div>
              </div>

              {/* Micro Testimonial Card */}
              <div className="p-4 rounded-2xl bg-card/90 backdrop-blur-xs border border-border/80 shadow-xs space-y-2 relative z-10">
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3.5 fill-amber-400 stroke-amber-500" />
                  ))}
                </div>
                <p className="text-xs text-foreground/90 italic leading-relaxed">
                  “Found an electrician within 15 minutes of an outage. Professional, on time, and fair pricing!”
                </p>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                  <span className="font-semibold text-foreground">Rachel M.</span>
                  <span>Verified Homeowner</span>
                </div>
              </div>
            </div>

            {/* Right: The Auth Form Container */}
            <div className="col-span-1 lg:col-span-7 flex justify-center">
              <div className="w-full max-w-lg">
                {children}
              </div>
            </div>
          </div>
        </PageContainer>
      </main>

      {/* Authoritative Global Footer */}
      <Footer />
    </div>
  )
}
