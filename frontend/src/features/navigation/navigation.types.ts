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
  label?: string
  route?: string
  requiredPermission?: string
}

export interface NavigationSection {
  id: string
  title?: string
  items: NavigationItem[]
}

export interface ServerMenuItem {
  id: string
  label: string
  route: string
  icon: string
  requiredPermission?: string
  badge?: string | number
  badgeVariant?: "primary" | "success" | "warning" | "destructive"
  children?: ServerMenuItem[]
  title?: string
  href?: string
}

export interface NavigationMenuResponse {
  items: ServerMenuItem[]
}

