import 'dotenv/config';
import { db } from '../src/prisma/db.js';

/**
 * Least-privilege role-permission mappings based on confirmed ServiceHub functionality:
 *
 * 1. CUSTOMER:
 *    - Profile: Own profile read & update
 *    - Services: Read published services and categories
 *    - Bookings: Read own bookings, create bookings, cancel bookings
 *
 * 2. SERVICE_PROVIDER:
 *    - Profile: Own profile read & update
 *    - Services: Read categories/services; create, update, and delete own services
 *    - Bookings: Read assigned bookings, update booking status (confirm, in-progress, complete)
 *
 * 3. ADMIN:
 *    - Complete administrative access across users, services, bookings, provider verification,
 *      roles, permissions, and audit logs.
 */
const ROLE_PERMISSIONS_MAPPING: Record<string, readonly string[]> = {
  CUSTOMER: [
    'profile:read',
    'profile:update',
    'providers:read',
    'categories:read',
    'services:read',
    'bookings:read',
    'bookings:create',
    'bookings:cancel',
  ],
  SERVICE_PROVIDER: [
    'profile:read',
    'profile:update',
    'categories:read',
    'services:read',
    'services:create',
    'services:update',
    'services:delete',
    'providers:read',
    'providers:manage',
    'bookings:read',
    'bookings:update',
  ],
  ADMIN: [
    'profile:read',
    'profile:update',
    'users:read',
    'users:manage',
    'categories:read',
    'categories:manage',
    'services:read',
    'services:create',
    'services:update',
    'services:delete',
    'providers:read',
    'providers:manage',
    'providers:verify',
    'bookings:read',
    'bookings:create',
    'bookings:update',
    'bookings:cancel',
    'bookings:manage',
    'roles:manage',
    'permissions:manage',
    'audit-logs:read',
  ],
};

async function seedRolePermissions(): Promise<void> {
  console.log('Starting role-permission seeding workflow...');

  const roles = await db.orm.public.Role.all();
  const roleMap = new Map<string, number>(roles.map((r) => [r.name, r.id]));

  const permissions = await db.orm.public.Permission.all();
  const permMap = new Map<string, number>(
    permissions.map((p) => [p.code, p.id]),
  );

  let createdCount = 0;
  let skippedCount = 0;

  for (const [roleName, permCodes] of Object.entries(
    ROLE_PERMISSIONS_MAPPING,
  )) {
    const roleId = roleMap.get(roleName);
    if (!roleId) {
      throw new Error(
        `Role "${roleName}" not found in database. Run seed:roles first.`,
      );
    }

    for (const permCode of permCodes) {
      const permissionId = permMap.get(permCode);
      if (!permissionId) {
        throw new Error(
          `Permission "${permCode}" not found in database. Run seed:permissions first.`,
        );
      }

      const existing = await db.orm.public.RolePermission.where({
        roleId,
        permissionId,
      }).first();

      if (existing) {
        console.log(
          `[SKIP] Mapping "${roleName}" -> "${permCode}" already exists.`,
        );
        skippedCount++;
        continue;
      }

      await db.orm.public.RolePermission.create({
        roleId,
        permissionId,
      });

      console.log(`[CREATED] Mapping "${roleName}" -> "${permCode}" created.`);
      createdCount++;
    }
  }

  console.log(
    `Role-permission seeding workflow completed. Created: ${createdCount}, Skipped: ${skippedCount}.`,
  );
}

async function main(): Promise<void> {
  try {
    await seedRolePermissions();
  } finally {
    await db.close();
  }
}

main().catch((error: unknown) => {
  console.error('Role-permission seeding failed:', error);
  process.exitCode = 1;
});
