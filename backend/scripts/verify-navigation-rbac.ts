import 'dotenv/config';
import { Reflector } from '@nestjs/core';
import {
  filterMenuItemsByPermissions,
  mergeRoleMenus,
  NavigationService,
} from '../src/navigation/navigation.service.js';
import {
  CUSTOMER_MENU,
  SERVICE_PROVIDER_MENU,
  ADMIN_MENU,
  ROLE_MENU_CONFIG,
} from '../src/navigation/navigation.config.js';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard.js';
import { PermissionsService } from '../src/auth/permissions.service.js';
import { db } from '../src/prisma/db.js';

async function runVerification() {
  console.log(
    '=== ServiceHub Navigation & Permission Enforcement Verification ===\n',
  );

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}${detail ? `: ${detail}` : ''}`);
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // Case 1: User with a role and required permission receives the menu item
  // --------------------------------------------------------------------------
  const customerPermissions = new Set<string>([
    'profile:read',
    'profile:update',
    'categories:read',
    'services:read',
    'bookings:read',
    'bookings:create',
    'bookings:cancel',
  ]);
  const customerFiltered = filterMenuItemsByPermissions(
    CUSTOMER_MENU,
    customerPermissions,
  );
  const customerItemIds = customerFiltered.map((i) => i.id);

  assert(
    customerItemIds.includes('explore') &&
      customerItemIds.includes('categories') &&
      customerItemIds.includes('bookings') &&
      customerItemIds.includes('settings'),
    'Case 1: User with role and required permissions receives all matching menu items',
    `Expected explore, categories, bookings, settings; got: ${customerItemIds.join(', ')}`,
  );

  // --------------------------------------------------------------------------
  // Case 2: User whose role config includes a menu but lacks its permission does NOT receive it
  // --------------------------------------------------------------------------
  // Suppose bookings:read is revoked/missing
  const customerWithoutBookings = new Set<string>([
    'profile:read',
    'profile:update',
    'categories:read',
    'services:read',
    // 'bookings:read' omitted
  ]);
  const filteredWithoutBookings = filterMenuItemsByPermissions(
    CUSTOMER_MENU,
    customerWithoutBookings,
  );
  const idsWithoutBookings = filteredWithoutBookings.map((i) => i.id);

  assert(
    !idsWithoutBookings.includes('bookings') &&
      idsWithoutBookings.includes('explore'),
    'Case 2: User whose role configuration includes a menu but lacks its permission does not receive it',
    `Bookings item correctly excluded. Remaining: ${idsWithoutBookings.join(', ')}`,
  );

  // --------------------------------------------------------------------------
  // Case 2b: Nested child filtering & empty child removal
  // --------------------------------------------------------------------------
  // Provider menu has 'provider-services' with children: 'provider-services-list' (services:read)
  // and 'provider-services-create' (services:create).
  // If user only has 'services:read', 'provider-services-create' should be omitted from children.
  const providerWithOnlyRead = new Set<string>(['services:read']);
  const providerFiltered = filterMenuItemsByPermissions(
    SERVICE_PROVIDER_MENU,
    providerWithOnlyRead,
  );
  const providerServicesItem = providerFiltered.find(
    (i) => i.id === 'provider-services',
  );

  assert(
    providerServicesItem !== undefined &&
      providerServicesItem.children?.length === 1 &&
      providerServicesItem.children[0].id === 'provider-services-list',
    'Case 2b: Nested menu filtering removes unauthorized child items and retains authorized ones',
  );

  // --------------------------------------------------------------------------
  // Case 3: A user without roles receives no menu items
  // --------------------------------------------------------------------------
  const mockPermissionsServiceNoRoles = {
    getUserRolesAndPermissions: async () => ({
      roles: [],
      permissions: new Set<string>(),
    }),
  } as unknown as PermissionsService;

  const navigationServiceNoRoles = new NavigationService(
    mockPermissionsServiceNoRoles,
  );
  const emptyResult = await navigationServiceNoRoles.getMenuForUser(9999);

  assert(
    Array.isArray(emptyResult.items) && emptyResult.items.length === 0,
    'Case 3: A user without roles receives no menu items ({ items: [] })',
    `Got length: ${emptyResult.items.length}`,
  );

  // --------------------------------------------------------------------------
  // Case 4: Multiple roles produce a deduplicated menu
  // --------------------------------------------------------------------------
  const mergedMultiRole = mergeRoleMenus(['CUSTOMER', 'SERVICE_PROVIDER']);
  const mergedIds = mergedMultiRole.map((i) => i.id);
  const uniqueIds = new Set(mergedIds);

  assert(
    mergedIds.length === uniqueIds.size &&
      mergedIds.includes('explore') &&
      mergedIds.includes('provider-dashboard'),
    'Case 4: Multiple roles produce a deduplicated menu collection',
    `Total items: ${mergedIds.length}, Unique IDs: ${uniqueIds.size}`,
  );

  // --------------------------------------------------------------------------
  // Case 5: Protected API access is still denied when required permission is missing
  // --------------------------------------------------------------------------
  const reflector = new Reflector();
  reflector.getAllAndOverride = () => ['users:read']; // Endpoint requires users:read

  // Mock a customer user with only customer permissions (does NOT have users:read)
  const mockPermissionsServiceCustomer = {
    getUserRolesAndPermissions: async () => ({
      roles: ['CUSTOMER'],
      permissions: customerPermissions, // lacks users:read
    }),
  } as unknown as PermissionsService;

  const permissionsGuardCustomer = new PermissionsGuard(
    reflector,
    mockPermissionsServiceCustomer,
  );

  const contextCustomer = {
    getHandler: () => () => {},
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ user: { userId: 101 } }) }),
  };

  let deniedWith403 = false;
  try {
    await permissionsGuardCustomer.canActivate(contextCustomer as any);
  } catch (err: any) {
    if (err.status === 403) {
      deniedWith403 = true;
    }
  }

  assert(
    deniedWith403,
    'Case 5: Protected API access is denied with 403 when required permission is missing',
  );

  // --------------------------------------------------------------------------
  // Case 5b: Protected API access is granted when required permission is present
  // --------------------------------------------------------------------------
  const mockPermissionsServiceAdmin = {
    getUserRolesAndPermissions: async () => ({
      roles: ['ADMIN'],
      permissions: new Set(['users:read', 'audit-logs:read']),
    }),
  } as unknown as PermissionsService;

  const permissionsGuardAdmin = new PermissionsGuard(
    reflector,
    mockPermissionsServiceAdmin,
  );

  const contextAdmin = {
    getHandler: () => () => {},
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ user: { userId: 1 } }) }),
  };

  const allowedAdmin = await permissionsGuardAdmin.canActivate(
    contextAdmin as any,
  );

  assert(
    allowedAdmin === true,
    'Case 5b: Protected API access is granted when required permission is present',
  );

  console.log(`\nVerification finished: ${passed} passed, ${failed} failed.`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

runVerification()
  .catch((err) => {
    console.error('Unexpected error during verification:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.close();
  });
