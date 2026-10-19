import * as argon2 from 'argon2';
import { db } from '../src/prisma/db.js';

async function main() {
  const email = 'norole@servicehub.com';
  const password = 'Password123!';
  const passwordHash = await argon2.hash(password);

  let user = await db.orm.public.User.where({ email: email as any }).first();
  if (!user) {
    user = await db.orm.public.User.create({
      email: email as any,
      passwordHash,
      firstName: 'NoRole' as any,
      lastName: 'User' as any,
      phone: '+15550009999' as any,
      emailVerified: true,
      status: 'ACTIVE',
    });
    console.log(`Created user ${user.id} (${email}) with NO roles.`);
  } else {
    await db.orm.public.User.where({ id: user.id }).update({
      emailVerified: true,
      status: 'ACTIVE',
      passwordHash,
    });
    // Delete any existing UserRole records for this user to ensure zero roles
    const existingRoles = await db.orm.public.UserRole.where({ userId: user.id }).all();
    for (const ur of existingRoles) {
      await db.orm.public.UserRole.where({ userId: user.id, roleId: ur.roleId }).delete();
    }
    console.log(`User ${user.id} (${email}) verified with NO roles.`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
