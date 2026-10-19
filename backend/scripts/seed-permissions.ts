import 'dotenv/config';
import type { Varchar } from '@prisma/orm-postgres/target/codec-types';
import { db } from '../src/prisma/db.js';

interface SeedPermission {
  code: string;
  description: string;
  category: 'implemented' | 'planned';
}

/**
 * Initial ServiceHub permissions set.
 *
 * Distinct categories:
 * - 'implemented': Backed by currently existing NestJS controllers/services (e.g., users, profile).
 * - 'planned': Backed by core domain models defined in contract.prisma (e.g., services, bookings, providers, audit logs).
 */
const PERMISSIONS_TO_SEED: readonly SeedPermission[] = [
  // User & Profile Access (Implemented in UsersController)
  {
    code: 'profile:read',
    description: 'View authenticated user profile details',
    category: 'implemented',
  },
  {
    code: 'profile:update',
    description: 'Update authenticated user profile information',
    category: 'implemented',
  },
  {
    code: 'users:read',
    description: 'View and list user accounts',
    category: 'implemented',
  },
  {
    code: 'users:manage',
    description: 'Create, update, and manage user accounts',
    category: 'implemented',
  },

  // Service Management (Planned - backed by Service and Category schema models)
  {
    code: 'services:read',
    description: 'View published services, descriptions, and pricing',
    category: 'planned',
  },
  {
    code: 'services:create',
    description: 'Create and publish new provider services',
    category: 'planned',
  },
  {
    code: 'services:update',
    description: 'Update existing service details, pricing, and duration',
    category: 'planned',
  },
  {
    code: 'services:delete',
    description: 'Delete or deactivate services',
    category: 'planned',
  },
  {
    code: 'categories:read',
    description: 'View service categories',
    category: 'planned',
  },
  {
    code: 'categories:manage',
    description: 'Create, update, and manage service categories',
    category: 'planned',
  },

  // Booking Management (Planned - backed by Booking, Cancellation, and Reassignment schema models)
  {
    code: 'bookings:read',
    description: 'View booking details and booking history',
    category: 'planned',
  },
  {
    code: 'bookings:create',
    description: 'Create and hold service bookings',
    category: 'planned',
  },
  {
    code: 'bookings:update',
    description: 'Update booking status, reschedule, or confirm bookings',
    category: 'planned',
  },
  {
    code: 'bookings:cancel',
    description: 'Cancel existing bookings within policy',
    category: 'planned',
  },
  {
    code: 'bookings:manage',
    description: 'Administrative booking overrides and reassignments',
    category: 'planned',
  },

  // Provider Profile & Verification Management
  {
    code: 'providers:read',
    description: 'View provider profile, service areas, and verification status',
    category: 'implemented',
  },
  {
    code: 'providers:manage',
    description: 'Create and update provider profile, service areas, and verification documents',
    category: 'implemented',
  },
  {
    code: 'providers:verify',
    description:
      'Review and approve or reject provider verification applications',
    category: 'implemented',
  },
  {
    code: 'roles:manage',
    description: 'Manage platform roles and role assignments',
    category: 'planned',
  },
  {
    code: 'permissions:manage',
    description: 'Manage platform permissions and role-permission mappings',
    category: 'planned',
  },
  {
    code: 'audit-logs:read',
    description: 'View platform audit logs and system event history',
    category: 'planned',
  },
] as const;

async function seedPermissions(): Promise<void> {
  console.log('Starting permission seeding workflow...');

  let createdCount = 0;
  let skippedCount = 0;

  for (const perm of PERMISSIONS_TO_SEED) {
    const permCode = perm.code as Varchar<100>;

    const existing = await db.orm.public.Permission.where({
      code: permCode,
    }).first();

    if (existing) {
      console.log(
        `[SKIP] Permission "${existing.code}" already exists (id: ${existing.id}). Preserving existing description: "${existing.description ?? ''}".`,
      );
      skippedCount++;
      continue;
    }

    const created = await db.orm.public.Permission.create({
      code: permCode,
      description: perm.description,
    });

    console.log(
      `[CREATED] Permission "${created.code}" created with id: ${created.id} (${perm.category}).`,
    );
    createdCount++;
  }

  console.log(
    `Permission seeding workflow completed. Created: ${createdCount}, Skipped: ${skippedCount}.`,
  );
}

async function main(): Promise<void> {
  try {
    await seedPermissions();
  } finally {
    await db.close();
  }
}

main().catch((error: unknown) => {
  console.error('Permission seeding failed:', error);
  process.exitCode = 1;
});
