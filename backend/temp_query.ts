import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
  });
  const staff = await prisma.user.findMany({
    where: { role: 'STAFF' },
  });
  
  console.log('ADMINS:');
  admins.forEach((u, i) => {
    console.log(`  ${i+1}. ${u.firstName} ${u.lastName}`);
    console.log(`     Email: ${u.email}`);
  });
  
  console.log('\nSTAFF:');
  staff.forEach((u, i) => {
    console.log(`  ${i+1}. ${u.firstName} ${u.lastName}`);
    console.log(`     Email: ${u.email}`);
  });
  
  await prisma.$disconnect();
}

main();
