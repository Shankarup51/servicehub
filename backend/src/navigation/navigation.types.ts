import { PermissionCode } from '../auth/decorators/permissions.decorator.js';

export interface MenuItem {
  id: string;
  label: string;
  route: string;
  icon: string;
  requiredPermission: PermissionCode;
  badge?: string | number;
  badgeVariant?: 'primary' | 'success' | 'warning' | 'destructive';
  children?: MenuItem[];
  // Frontend navigation compatibility aliases
  title?: string;
  href?: string;
}

export interface NavigationMenuResponse {
  items: MenuItem[];
}
