import 'dotenv/config';
import type { Varchar } from '@prisma/orm-postgres/target/codec-types';
import { db } from '../src/prisma/db.js';

interface SeedRole {
  name: string;
  description: string;
}

const ROLES_TO_SEED: readonly SeedRole[] = [
  {
    name: 'CUSTOMER',
    description: 'Standard customer account for browsing and booking services',
  },
  {
    name: 'SERVICE_PROVIDER',
    description: 'Service provider account for offering and managing services',
  },
  {
    name: 'ADMIN',
    description: 'Platform administrator with full system management access',
  },
] as const;

async function seedRoles(): Promise<void> {
  console.log('Starting role seeding workflow...');

  for (const role of ROLES_TO_SEED) {
    const roleName = role.name as Varchar<50>;

    const existing = await db.orm.public.Role.where({
      name: roleName,
    }).first();

    if (existing) {
      console.log(
        `[SKIP] Role "${existing.name}" already exists (id: ${existing.id}). Preserving existing description: "${existing.description ?? ''}".`,
      );
      continue;
    }

    const created = await db.orm.public.Role.create({
      name: roleName,
      description: role.description,
    });

    console.log(
      `[CREATED] Role "${created.name}" created with id: ${created.id}.`,
    );
  }

  console.log('Role seeding workflow completed successfully.');
}

async function main(): Promise<void> {
  try {
    await seedRoles();
  } finally {
    await db.close();
  }
}

main().catch((error: unknown) => {
  console.error('Role seeding failed:', error);
  process.exitCode = 1;
});
