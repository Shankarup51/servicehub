import * as argon2 from 'argon2';
import { db } from '../src/prisma/db.js';

interface TestAccountConfig {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  roleName: 'CUSTOMER' | 'SERVICE_PROVIDER' | 'ADMIN';
}

const TEST_ACCOUNTS: TestAccountConfig[] = [
  {
    email: 'customer@servicehub.com',
    password: 'Password123!',
    firstName: 'Jane',
    lastName: 'Customer',
    phone: '+15550001111',
    roleName: 'CUSTOMER',
  },
  {
    email: 'provider@servicehub.com',
    password: 'Password123!',
    firstName: 'David',
    lastName: 'Provider',
    phone: '+15550002222',
    roleName: 'SERVICE_PROVIDER',
  },
  {
    email: 'admin@servicehub.com',
    password: 'Password123!',
    firstName: 'Arthur',
    lastName: 'Admin',
    phone: '+15550003333',
    roleName: 'ADMIN',
  },
];

async function main() {
  console.log('Seeding / verifying test accounts...');

  for (const acc of TEST_ACCOUNTS) {
    const role = await db.orm.public.Role.where({ name: acc.roleName }).first();
    if (!role) {
      console.error(`Role ${acc.roleName} not found! Run seed-roles.ts first.`);
      continue;
    }

    let user = await db.orm.public.User.where({ email: acc.email as any }).first();
    const passwordHash = await argon2.hash(acc.password);

    if (!user) {
      user = await db.orm.public.User.create({
        email: acc.email as any,
        passwordHash,
        firstName: acc.firstName as any,
        lastName: acc.lastName as any,
        phone: acc.phone as any,
        emailVerified: true,
        status: 'ACTIVE',
      });
      console.log(`Created user ${acc.email} (ID: ${user.id})`);
    } else {
      // Ensure verified and update password if needed
      await db.orm.public.User.where({ id: user.id }).update({
        emailVerified: true,
        status: 'ACTIVE',
        passwordHash,
      });
      console.log(`Updated user ${acc.email} (ID: ${user.id}) to ACTIVE & Verified`);
    }

    // Ensure UserRole association
    const existingUserRole = await db.orm.public.UserRole.where({
      userId: user.id,
      roleId: role.id,
    }).first();

    if (!existingUserRole) {
      await db.orm.public.UserRole.create({
        userId: user.id,
        roleId: role.id,
      });
      console.log(`Assigned role ${acc.roleName} to ${acc.email}`);
    } else {
      console.log(`User ${acc.email} already has role ${acc.roleName}`);
    }
  }

  console.log('Test accounts successfully verified & seeded!');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error seeding test accounts:', err);
    process.exit(1);
  });
