import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(){
  const includeStudents = true;
  const where = includeStudents ? {} : { role: { in: ['ADMIN', 'STAFF'] } };
  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: { firstName: true, lastName: true, email: true, role: true }
  });

  console.log('TOTAL USERS RETURNED:', users.length);
  users.forEach(u => console.log(`${u.firstName} ${u.lastName} - ${u.email} (${u.role})`));

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
