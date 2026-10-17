# ServiceHub Reusable UI Design System

This document outlines the architecture, color palette, design tokens, component catalog, and developer usage guidelines for the **ServiceHub** frontend application.

> **Project Mandate**: All upcoming pages (such as Login, Registration, Service Browsing, Booking Checkout, and Dashboard Portals) **must consume this shared library** rather than creating ad-hoc or duplicate UI controls.

---

## 1. Authoritative Color Palette & Tokens

The ServiceHub design system is built on a warm, elegant crimson/maroon visual identity designed for trust, clarity, and visual impact.

| Token | Hex Value | Semantic Role |
| :--- | :--- | :--- |
| `--background` | `#FCEEEF` | Master app background (pastel light pink) |
| `--primary` | `#9C1E32` | Primary branding, primary buttons, active link states |
| `--primary-foreground` | `#FFFFFF` | Text on primary branding/buttons |
| `--card` / `--sidebar` | `#FFFFFF` | Surface container for cards, sidebars, and dialogs |
| `--foreground` | `#1A1D20` | Primary high-contrast text |
| `--muted-foreground` | `#7C838A` | Secondary descriptions, hints, and placeholders |
| `--border` | `#F0D5D8` | Structural dividing lines and container borders |
| `--input` | `#E8CBCE` | Input field borders and unselected checkboxes |
| `--ring` | `#9C1E32` | Focus-visible outlines and accessibility rings |
| `--success` / `--success-foreground` | `#D3F6E7` / `#1FA86A` | Confirmed bookings, positive indicators |
| `--warning` / `--warning-foreground` | `#FEEFD4` / `#C47414` | Pending reviews, attention notices |
| `--processing` / `--processing-foreground` | `#F7E5EC` / `#9E4369` | In-progress jobs, active sessions |
| `--destructive` / `--destructive-foreground` | `#FDE8E8` / `#D92D20` | Errors, cancellations, high-risk actions |

All tokens are defined in `:root` and `.dark` inside [src/app/globals.css](file:///c:/Users/HP/Desktop/New%20folder%20(2)/servicehub/frontend/src/app/globals.css) and exposed to Tailwind CSS v4 via `@theme inline`.

---

## 2. Directory Structure

```text
frontend/src/
├── app/
│   ├── components/page.tsx      # Comprehensive Design System Showcase
│   ├── globals.css              # Authoritative CSS variables & Tailwind v4 theme
│   └── layout.tsx               # Root layout with Providers & GlobalToaster
├── components/
│   ├── ui/                      # Core interactive primitives
│   │   ├── button.tsx           # Button (variants, sizes, isLoading, icons)
│   │   ├── web-text.tsx         # Semantic typography (h1-h6, body, lead, caption)
│   │   ├── input.tsx            # Input with eye password toggle, clear button
│   │   ├── textarea.tsx         # Textarea with character count & resize options
│   │   ├── select.tsx           # Radix-powered accessible Select dropdown
│   │   ├── date-picker.tsx      # DatePicker with native trigger & clear button
│   │   ├── checkbox.tsx         # Radix Checkbox with label & description
│   │   ├── switch.tsx           # Radix Switch toggle with smooth animation
│   │   └── radio-group.tsx      # Radix RadioGroup with active dot indicator
│   ├── forms/                   # Form layout wrappers
│   │   ├── form-field.tsx       # Label, required asterisk, hint, and error alert
│   │   └── form-actions.tsx     # Action button row (alignments & sticky mode)
│   ├── feedback/                # Asynchronous state indicators
│   │   ├── spinner.tsx          # Loading spinners (sizes & colors)
│   │   ├── skeleton.tsx         # Pulse skeletons (text, avatar, card)
│   │   ├── empty-state.tsx      # Empty dataset presentation
│   │   └── error-state.tsx      # API/runtime failure alerts with retry CTA
│   ├── overlays/                # Modal dialogs & sheets
│   │   ├── dialog.tsx           # Radix Dialog (Header, Footer, Title, Content)
│   │   ├── confirmation-dialog.tsx # High-impact / destructive confirmation modal
│   │   └── responsive-drawer.tsx # Slide-in side drawer (right, left, bottom)
│   ├── layout/                  # Page scaffolding
│   │   ├── page-container.tsx   # Responsive max-width container
│   │   ├── page-header.tsx      # Title, description, back button, actions
│   │   ├── breadcrumbs.tsx      # Accessible breadcrumb trail
│   │   ├── header.tsx           # Main desktop header + mobile drawer nav
│   │   ├── footer.tsx           # Footer with links & prerender-safe copyright
│   │   └── sidebar.tsx          # Collapsible portal sidebar with badge counts
│   ├── data-display/            # Rich presentation components
│   │   ├── base-card.tsx        # Card, CardHeader, CardTitle, CardContent
│   │   ├── status-badge.tsx     # Semantic status pills (success, warning, etc.)
│   │   ├── statistic-card.tsx   # Dashboard KPI metric cards
│   │   ├── service-card.tsx     # Marketplace service display card
│   │   ├── category-card.tsx    # Category navigation card
│   │   ├── booking-card.tsx     # Booking summary card (Customer/Provider)
│   │   ├── data-table.tsx       # Typed data table with loading skeleton
│   │   ├── pagination.tsx       # Accessible page pagination
│   │   └── search-filter-bar.tsx # Search input + category + sort controls
│   └── editors/                 # Content editors
│       └── rich-text-editor.tsx # SSR-safe rich text editor with toolbar
├── features/
│   └── navigation/              # Typed navigation data & contracts
│       ├── navigation.types.ts  # NavigationItem & NavigationSection
│       └── navigation.data.ts   # Customer, Provider, & Admin menu configurations
├── lib/
│   └── utils.ts                 # Canonical cn() class merger
└── shared/
    └── ui/
        ├── global-toaster.tsx   # Sonner Toaster container
        └── toast-service.ts     # Typed toast helpers (showSuccessToast, etc.)
```

---

## 3. Component Usage Guide

### Buttons
```tsx
import { Button } from "@/components/ui/button"

<Button variant="primary" size="default" isLoading={isSubmitting}>
  Book Now
</Button>
<Button variant="outline" leftIcon={<Calendar className="size-4" />}>
  Select Date
</Button>
```

### Form Fields & Inputs
```tsx
import { FormField } from "@/components/forms/form-field"
import { Input } from "@/components/ui/input"
import { Mail } from "lucide-react"

<FormField
  label="Email Address"
  required
  hint="We'll send your booking receipts here"
  error={errors.email}
>
  <Input
    type="email"
    placeholder="you@example.com"
    leftIcon={<Mail className="size-4" />}
  />
</FormField>
```

### Password Input with Automatic Eye Toggle
```tsx
<FormField label="Password" required>
  <Input type="password" placeholder="Enter secure password" />
</FormField>
```

### Status Badges
```tsx
import { StatusBadge } from "@/components/data-display/status-badge"

<StatusBadge status="success" hasDot>CONFIRMED</StatusBadge>
<StatusBadge status="warning" hasDot>PENDING</StatusBadge>
<StatusBadge status="processing" hasDot>IN PROGRESS</StatusBadge>
<StatusBadge status="destructive" hasDot>CANCELLED</StatusBadge>
```

### Toasts
```tsx
import { showSuccessToast, showErrorToast } from "@/shared/ui/toast-service"

showSuccessToast("Booking Created!", {
  description: "Provider has received your request.",
})
```

---

## 4. Verification & Testing

1. **Development Showcase**: Visit `http://localhost:3000/components` to visually test every component, overlay, modal, and interactive state.
2. **Type Safety**: Execute `npx tsc --noEmit` inside `frontend/` to ensure full compliance with TypeScript contracts.
