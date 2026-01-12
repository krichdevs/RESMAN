import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating email domains from .edu.gh to .edu...\n');

  const users = await prisma.user.findMany();
  
  let updatedCount = 0;

  for (const user of users) {
    if (user.email.endsWith('@centraluniversity.edu.gh')) {
      const newEmail = user.email.replace('@centraluniversity.edu.gh', '@centraluniversity.edu');
      
      await prisma.user.update({
        where: { id: user.id },
        data: { email: newEmail },
      });
      
      console.log(`Updated: ${user.email} → ${newEmail}`);
      updatedCount++;
    }
  }

  console.log(`\n✓ Successfully updated ${updatedCount} email addresses`);
  
  // Show updated summary
  const updatedUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  console.log('\nSample of updated emails:');
  updatedUsers.forEach((user) => {
    console.log(`  ${user.firstName} ${user.lastName}: ${user.email}`);
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
