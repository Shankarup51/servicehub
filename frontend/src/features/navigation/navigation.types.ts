export interface NavigationItem {
  id: string
  title: string
  href: string
  icon?: string
  badge?: string | number
  badgeVariant?: "primary" | "success" | "warning" | "destructive"
  disabled?: boolean
  children?: NavigationItem[]
  roles?: ("CUSTOMER" | "SERVICE_PROVIDER" | "ADMIN")[]
}

export interface NavigationSection {
  id: string
  title?: string
  items: NavigationItem[]
}
