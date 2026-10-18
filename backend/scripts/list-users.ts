import { db } from '../src/prisma/db.js';

async function main() {
  const users = await db.orm.public.User.all();
  console.log(`Found ${users.length} users:`);
  for (const u of users) {
    const userRoles = await db.orm.public.UserRole.where({ userId: u.id })
      .include('role')
      .all();
    const roleNames = userRoles.map((ur) => ur.role.name);
    console.log(`ID: ${u.id} | Email: ${u.email} | Verified: ${u.emailVerified} | Status: ${u.status} | Roles: [${roleNames.join(', ')}]`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
