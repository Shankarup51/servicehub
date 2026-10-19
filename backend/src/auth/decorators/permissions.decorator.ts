import { SetMetadata } from '@nestjs/common';

export type PermissionCode =
  | 'profile:read'
  | 'profile:update'
  | 'users:read'
  | 'users:manage'
  | 'services:read'
  | 'services:create'
  | 'services:update'
  | 'services:delete'
  | 'categories:read'
  | 'categories:manage'
  | 'bookings:read'
  | 'bookings:create'
  | 'bookings:update'
  | 'bookings:cancel'
  | 'bookings:manage'
  | 'providers:read'
  | 'providers:manage'
  | 'providers:verify'
  | 'roles:manage'
  | 'permissions:manage'
  | 'audit-logs:read';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to assign required permission codes to a controller method or class.
 *
 * @param permissions List of PermissionCode required to access the endpoint.
 */
export const Permissions = (...permissions: PermissionCode[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
