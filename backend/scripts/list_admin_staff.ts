import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' }
  });
  
  const staff = await prisma.user.findMany({
    where: { role: 'STAFF' }
  });
  
  console.log('=== ADMINS (Total: ' + admins.length + ') ===');
  admins.forEach((user, idx) => {
    console.log(`\n${idx + 1}. Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Department: ${user.department}`);
  });
  
  console.log('\n\n=== STAFF (Total: ' + staff.length + ') ===');
  staff.forEach((user, idx) => {
    console.log(`\n${idx + 1}. Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Department: ${user.department}`);
  });
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
