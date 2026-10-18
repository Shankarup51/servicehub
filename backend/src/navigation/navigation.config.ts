import { MenuItem } from './navigation.types.js';

/**
 * Predefined menu items for the CUSTOMER role.
 * Routes and icons align directly with frontend navigation (/services, /categories, /bookings, /settings).
 */
export const CUSTOMER_MENU: readonly MenuItem[] = [
  {
    id: 'customer-dashboard',
    label: 'Dashboard',
    route: '/dashboard',
    icon: 'dashboard',
    requiredPermission: 'services:read',
    title: 'Dashboard',
    href: '/dashboard',
  },
  {
    id: 'explore',
    label: 'Explore Services',
    route: '/services',
    icon: 'explore',
    requiredPermission: 'services:read',
    title: 'Explore Services',
    href: '/services',
  },
  {
    id: 'categories',
    label: 'Categories',
    route: '/categories',
    icon: 'categories',
    requiredPermission: 'categories:read',
    title: 'Categories',
    href: '/categories',
  },
  {
    id: 'bookings',
    label: 'My Bookings',
    route: '/bookings',
    icon: 'bookings',
    requiredPermission: 'bookings:read',
    title: 'My Bookings',
    href: '/bookings',
  },
  {
    id: 'settings',
    label: 'Profile Settings',
    route: '/settings',
    icon: 'settings',
    requiredPermission: 'profile:read',
    title: 'Profile Settings',
    href: '/settings',
  },
];

/**
 * Predefined menu items for the SERVICE_PROVIDER role.
 */
export const SERVICE_PROVIDER_MENU: readonly MenuItem[] = [
  {
    id: 'provider-dashboard',
    label: 'Dashboard',
    route: '/dashboard/provider',
    icon: 'dashboard',
    requiredPermission: 'services:read',
    title: 'Dashboard',
    href: '/dashboard/provider',
  },
  {
    id: 'provider-services',
    label: 'My Services',
    route: '/provider/services',
    icon: 'services',
    requiredPermission: 'services:read',
    title: 'My Services',
    href: '/provider/services',
    children: [
      {
        id: 'provider-services-list',
        label: 'View Services',
        route: '/provider/services',
        icon: 'services',
        requiredPermission: 'services:read',
        title: 'View Services',
        href: '/provider/services',
      },
      {
        id: 'provider-services-create',
        label: 'Add Service',
        route: '/provider/services/create',
        icon: 'services',
        requiredPermission: 'services:create',
        title: 'Add Service',
        href: '/provider/services/create',
      },
    ],
  },
  {
    id: 'provider-bookings',
    label: 'Customer Bookings',
    route: '/provider/bookings',
    icon: 'bookings',
    requiredPermission: 'bookings:read',
    title: 'Customer Bookings',
    href: '/provider/bookings',
  },
  {
    id: 'provider-settings',
    label: 'Profile Settings',
    route: '/provider/settings',
    icon: 'settings',
    requiredPermission: 'profile:read',
    title: 'Profile Settings',
    href: '/provider/settings',
  },
];

/**
 * Predefined menu items for the ADMIN role.
 */
export const ADMIN_MENU: readonly MenuItem[] = [
  {
    id: 'admin-dashboard',
    label: 'Dashboard',
    route: '/admin',
    icon: 'dashboard',
    requiredPermission: 'audit-logs:read',
    title: 'Dashboard',
    href: '/admin',
  },
  {
    id: 'admin-users',
    label: 'Users & Accounts',
    route: '/admin/users',
    icon: 'users',
    requiredPermission: 'users:read',
    title: 'Users & Accounts',
    href: '/admin/users',
  },
  {
    id: 'admin-providers',
    label: 'Service Providers',
    route: '/admin/providers',
    icon: 'providers',
    requiredPermission: 'providers:verify',
    title: 'Service Providers',
    href: '/admin/providers',
  },
  {
    id: 'admin-services',
    label: 'Services Catalog',
    route: '/admin/services',
    icon: 'services',
    requiredPermission: 'services:read',
    title: 'Services Catalog',
    href: '/admin/services',
    children: [
      {
        id: 'admin-services-list',
        label: 'All Services',
        route: '/admin/services',
        icon: 'services',
        requiredPermission: 'services:read',
        title: 'All Services',
        href: '/admin/services',
      },
      {
        id: 'admin-services-categories',
        label: 'Categories Management',
        route: '/admin/categories',
        icon: 'categories',
        requiredPermission: 'categories:manage',
        title: 'Categories Management',
        href: '/admin/categories',
      },
    ],
  },
  {
    id: 'admin-bookings',
    label: 'Bookings Management',
    route: '/admin/bookings',
    icon: 'bookings',
    requiredPermission: 'bookings:manage',
    title: 'Bookings Management',
    href: '/admin/bookings',
  },
  {
    id: 'admin-roles',
    label: 'Roles & Permissions',
    route: '/admin/roles',
    icon: 'settings',
    requiredPermission: 'roles:manage',
    title: 'Roles & Permissions',
    href: '/admin/roles',
  },
];

/**
 * Role to predefined menu collection mapping.
 */
export const ROLE_MENU_CONFIG: Record<string, readonly MenuItem[]> = {
  CUSTOMER: CUSTOMER_MENU,
  SERVICE_PROVIDER: SERVICE_PROVIDER_MENU,
  ADMIN: ADMIN_MENU,
};
