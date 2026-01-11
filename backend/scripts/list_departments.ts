import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { department: true } });
  const depts = Array.from(new Set(users.map((u) => u.department).filter(Boolean)));

  console.log('Distinct departments/count found in users table:');
  console.log('count:', depts.length);
  console.log('departments:', depts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
