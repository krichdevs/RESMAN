import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating roles to keep only admin@centraluniversity.edu as ADMIN...\n');

  // Keep this one as ADMIN
  const adminToKeep = 'admin@centraluniversity.edu';

  // Convert these to STAFF
  const adminsToConvert = [
    'admin@central.edu',
    'admin@miotso.centraluniversity.edu.gh'
  ];

  let convertedCount = 0;

  for (const email of adminsToConvert) {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (user) {
      await prisma.user.update({
        where: { email },
        data: { role: 'STAFF' }
      });
      console.log(`✓ Updated ${email} from ADMIN to STAFF`);
      convertedCount++;
    }
  }

  console.log(`\n✅ Successfully converted ${convertedCount} admin accounts to STAFF\n`);

  // Show final summary
  console.log('=== FINAL BREAKDOWN ===\n');

  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { firstName: true, lastName: true, email: true }
  });

  const staff = await prisma.user.findMany({
    where: { role: 'STAFF' },
    select: { firstName: true, lastName: true, email: true }
  });

  console.log(`ADMIN (${admins.length} total):`);
  admins.forEach(u => console.log(`  • ${u.firstName} ${u.lastName} - ${u.email}`));

  console.log(`\nSTAFF (${staff.length} total):`);
  staff.forEach(u => console.log(`  • ${u.firstName} ${u.lastName} - ${u.email}`));

  await prisma.$disconnect();
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
